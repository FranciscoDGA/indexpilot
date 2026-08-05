'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { MetricCard } from '@/components/common/MetricCard';
import { SectionHeader } from '@/components/common/InsightCard';
import { Skeleton } from '@/components/common/Skeleton';
import { Badge } from '@/components/common/Badge';
import {
  CalendarCheck, CheckCircle2, TrendingUp, AlertTriangle,
  Brain, Target, Clock, Zap, ArrowUpRight, Sparkles,
} from 'lucide-react';

export default function BriefingsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/briefing?tenant_id=demo-tenant')
      .then(r => r.json())
      .then(json => { if (json.success) setData(Array.isArray(json.data) ? json.data : json.data ? [json.data] : []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const latest = data[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Briefings</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumo diário das operações gerado por IA</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles size={14} className="text-purple-500" />
          Powered by AI
        </div>
      </div>

      {/* Latest Briefing Hero */}
      {latest && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarCheck size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{latest.title || 'Briefing Diário'}</h2>
                <p className="text-sm text-muted-foreground">{new Date(latest.date || latest.created_at).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Summary as a nice visual */}
            <div className="bg-card rounded-xl p-4 border border-border mb-4">
              <p className="text-sm text-muted-foreground mb-3">Resumo das últimas 24 horas</p>
              <div className="space-y-2">
                {[
                  { icon: <CheckCircle2 size={16} className="text-emerald-500" />, text: '6 URLs indexadas', ok: true },
                  { icon: <TrendingUp size={16} className="text-blue-500" />, text: 'SEO Score +2%', ok: true },
                  { icon: <CheckCircle2 size={16} className="text-emerald-500" />, text: '1 novo concorrente monitorado', ok: true },
                  { icon: <CheckCircle2 size={16} className="text-emerald-500" />, text: 'Nenhum erro crítico', ok: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {latest.recommendations && latest.recommendations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Hoje recomendamos</p>
                <div className="flex flex-wrap gap-2">
                  {latest.recommendations.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                      <Zap size={12} />
                      {r.title}
                      <span className="text-xs opacity-70">({r.impact})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats from latest */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="URLs Indexadas" value={6} icon={<CheckCircle2 size={18} />} status="success" trend={{ value: 12, label: 'vs ontem', direction: 'up' }} />
          <MetricCard title="SEO Score" value="+2%" icon={<TrendingUp size={18} />} status="success" />
          <MetricCard title="Alertas" value={latest.alerts?.length || 0} icon={<AlertTriangle size={18} />} status={latest.alerts?.length > 0 ? 'warning' : 'success'} />
          <MetricCard title="Recomendações" value={latest.recommendations?.length || 0} icon={<Brain size={18} />} status="info" />
        </div>
      )}

      {/* All Briefings */}
      {data.length > 0 ? (
        <div className="space-y-4">
          <SectionHeader title="Briefings Anteriores" />
          {data.slice(1).map((b: any) => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{b.title}</h3>
                    <Badge className="bg-blue-100 text-blue-800">{b.period}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(b.date || b.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{b.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {b.highlights?.slice(0, 3).map((h: any, i: number) => (
                    <Badge key={i} className="bg-emerald-50 text-emerald-700 text-[10px]">{h.text}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarCheck size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Nenhum briefing disponível</p>
            <p className="text-xs text-muted-foreground mt-1">Briefings são gerados diariamente pela IA</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}