import { createClient } from '@/lib/supabase/server';
import type { PredictiveForecast, ForecastType } from '@/types/analytics';

export class PredictiveAnalytics {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async generateForecast(params: {
    tenantId: string;
    metricKey: string;
    forecastType?: ForecastType;
    periods: number;
    confidenceLevel?: number;
  }): Promise<PredictiveForecast[]> {
    const history = await this.getMetricHistory(params.tenantId, params.metricKey, 90);

    if (history.length < 7) {
      throw new Error('Insufficient data points for forecasting (minimum 7 required)');
    }

    const values = history.map(h => h.value);
    const forecastType = params.forecastType || 'linear_regression';
    const confidenceLevel = params.confidenceLevel || 95;

    let predictions: { value: number; lower: number; upper: number }[];

    switch (forecastType) {
      case 'linear_regression':
        predictions = this.linearRegression(values, params.periods);
        break;
      case 'moving_average':
        predictions = this.movingAverage(values, params.periods);
        break;
      case 'exponential_smoothing':
        predictions = this.exponentialSmoothing(values, params.periods);
        break;
      default:
        predictions = this.linearRegression(values, params.periods);
    }

    const forecasts: PredictiveForecast[] = [];
    const today = new Date();

    for (let i = 0; i < params.periods; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i + 1);

      forecasts.push({
        id: crypto.randomUUID(),
        tenant_id: params.tenantId,
        metric_key: params.metricKey,
        forecast_type: forecastType,
        target_date: targetDate.toISOString().split('T')[0],
        predicted_value: Math.round(predictions[i].value * 100) / 100,
        confidence_lower: Math.round(predictions[i].lower * 100) / 100,
        confidence_upper: Math.round(predictions[i].upper * 100) / 100,
        confidence_level: confidenceLevel,
        model_version: `${forecastType}-v1`,
        data_points_used: values.length,
        factors: this.identifyFactors(history),
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // Store forecasts
    for (const forecast of forecasts) {
      await this.supabase.from('predictive_forecasts').insert({
        tenant_id: forecast.tenant_id,
        metric_key: forecast.metric_key,
        forecast_type: forecast.forecast_type,
        target_date: forecast.target_date,
        predicted_value: forecast.predicted_value,
        confidence_lower: forecast.confidence_lower,
        confidence_upper: forecast.confidence_upper,
        confidence_level: forecast.confidence_level,
        model_version: forecast.model_version,
        data_points_used: forecast.data_points_used,
        factors: forecast.factors,
      });
    }

    return forecasts;
  }

  async getExistingForecasts(tenantId: string, metricKey?: string): Promise<PredictiveForecast[]> {
    let query = this.supabase
      .from('predictive_forecasts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('target_date', { ascending: true });

    if (metricKey) query = query.eq('metric_key', metricKey);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as PredictiveForecast[];
  }

  async evaluateForecastAccuracy(tenantId: string, metricKey: string): Promise<{
    total_forecasts: number;
    evaluated: number;
    avg_accuracy: number;
    mape: number;
  }> {
    const { data, error } = await this.supabase
      .from('predictive_forecasts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('metric_key', metricKey)
      .not('actual_value', 'is', null);

    if (error) throw error;

    const forecasts = (data || []) as PredictiveForecast[];
    if (forecasts.length === 0) return { total_forecasts: 0, evaluated: 0, avg_accuracy: 0, mape: 0 };

    let totalAbsError = 0;
    let totalAbsPctError = 0;

    for (const f of forecasts) {
      const absError = Math.abs(f.predicted_value - f.actual_value!);
      const absPctError = f.actual_value !== 0 ? (absError / Math.abs(f.actual_value!)) * 100 : 0;
      totalAbsError += absError;
      totalAbsPctError += absPctError;
    }

    return {
      total_forecasts: forecasts.length,
      evaluated: forecasts.length,
      avg_accuracy: Math.round((1 - totalAbsError / forecasts.reduce((s, f) => s + Math.abs(f.actual_value!), 0)) * 100),
      mape: Math.round(totalAbsPctError / forecasts.length),
    };
  }

  private linearRegression(values: number[], periods: number): { value: number; lower: number; upper: number }[] {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const residuals = values.map((v, i) => v - (intercept + slope * i));
    const sse = residuals.reduce((sum, r) => sum + r * r, 0);
    const stdError = Math.sqrt(sse / (n - 2));

    const results: { value: number; lower: number; upper: number }[] = [];
    for (let i = 0; i < periods; i++) {
      const predicted = intercept + slope * (n + i);
      const margin = 1.96 * stdError * Math.sqrt(1 + 1 / n + Math.pow(i - (n - 1) / 2, 2) / sumX2);
      results.push({
        value: Math.max(0, predicted),
        lower: Math.max(0, predicted - margin),
        upper: predicted + margin,
      });
    }

    return results;
  }

  private movingAverage(values: number[], periods: number, window: number = 7): { value: number; lower: number; upper: number }[] {
    const results: { value: number; lower: number; upper: number }[] = [];
    const recentValues = values.slice(-window);
    const avg = recentValues.reduce((s, v) => s + v, 0) / recentValues.length;
    const std = Math.sqrt(recentValues.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / recentValues.length);

    for (let i = 0; i < periods; i++) {
      results.push({
        value: Math.max(0, avg),
        lower: Math.max(0, avg - 1.96 * std),
        upper: avg + 1.96 * std,
      });
    }

    return results;
  }

  private exponentialSmoothing(values: number[], periods: number, alpha: number = 0.3): { value: number; lower: number; upper: number }[] {
    let forecast = values[0];
    for (let i = 1; i < values.length; i++) {
      forecast = alpha * values[i] + (1 - alpha) * forecast;
    }

    const residuals = values.map((v, i) => {
      let f = values[0];
      for (let j = 1; j <= i; j++) {
        f = alpha * values[j] + (1 - alpha) * f;
      }
      return v - f;
    });

    const std = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);
    const results: { value: number; lower: number; upper: number }[] = [];

    for (let i = 0; i < periods; i++) {
      results.push({
        value: Math.max(0, forecast),
        lower: Math.max(0, forecast - 1.96 * std * Math.sqrt(i + 1)),
        upper: forecast + 1.96 * std * Math.sqrt(i + 1),
      });
    }

    return results;
  }

  private async getMetricHistory(tenantId: string, metricKey: string, days: number): Promise<{ date: string; value: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('executive_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('metric_key', metricKey)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((d: any) => ({ date: d.created_at, value: d.metric_value }));
  }

  private identifyFactors(history: { date: string; value: number }[]): string[] {
    if (history.length < 14) return ['insufficient_history'];

    const factors: string[] = [];
    const recent7 = history.slice(-7).map(h => h.value);
    const previous7 = history.slice(-14, -7).map(h => h.value);

    const recentAvg = recent7.reduce((s, v) => s + v, 0) / recent7.length;
    const previousAvg = previous7.reduce((s, v) => s + v, 0) / previous7.length;

    if (recentAvg > previousAvg * 1.1) factors.push('positive_trend');
    else if (recentAvg < previousAvg * 0.9) factors.push('negative_trend');
    else factors.push('stable_trend');

    const variance = recent7.reduce((s, v) => s + Math.pow(v - recentAvg, 2), 0) / recent7.length;
    if (variance > Math.pow(recentAvg * 0.2, 2)) factors.push('high_volatility');

    return factors;
  }
}