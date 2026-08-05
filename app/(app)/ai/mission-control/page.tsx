'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { MetricCard } from '@/components/common/MetricCard';
import { SectionHeader } from '@/components/common/InsightCard';
import { Skeleton } from '@/components/common/Skeleton';
import { Badge } from '@/components/common/Badge';
import {
  BrainCircuit, Target, Route, CalendarCheck, BookOpen,
  Microscope, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Zap, Shield, Activity, Globe,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

export default function MissionControlPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/decisions?tenant_id=demo-tenant')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setDecisions(json.data?.decisions || []);
          setStats(json.data?.stats || { total: 0, pending: 0, approved: 0, completed: 0, avg_confidence: 0 });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        <div className="grid grid-cols-2 gap-4">{[1,2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      </div>
    );
  }

  const pendingDecisions = decisions.filter(d => d.status === 'pending');
  const recentDecisions = decisions.slice(0, 10);

  const chartData = [
    { name: 'Seg', decisions: 4, approved: 3 },
    { name: 'Ter', decisions: 6, approved: 5 },
    { name: 'Qua', decisions: 3, approved: 3 },
    { name: 'Qui', decisions: 8, approved: 6 },
    { name: 'Sex', decisions: 5, approved: 4 },
    { name: 'Sab', decisions: 2, approved: 2 },
    { name: 'Dom', decisions: 3, approved: 2 },
  ];

  const missionItems = [
    { icon: <CheckCircle2 size={16} className="text-emerald-500" />, text: '6 URLs indexadas com sucesso', ok: true },
    { icon: <TrendingUp size={16} className="text-blue-500" />, text: 'SEO Score evoluiu +2 pontos', ok: true },
    { icon: <AlertTriangle size={16} className="text-amber-500" />, text: '3 decisões pendentes de aprovação', ok: false },
    { icon: <Zap size={16} className="text-purple-500" />, text: '12 recomendações de IA disponíveis', ok: true },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Centro de Operações AI — IndexPilot OS 1.0</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Sistema ativo</span>
        </div>
      </div>

      {/* Mission Statement */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <BrainCircuit size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Missão do Dia</h2>
              <p className="text-xs text-muted-foreground">Resumo operacional das últimas 24h</p>
            </div>
          </div>
          <div className="space-y-2">
            {missionItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard title="Total Decisions" value={stats?.total || 0} icon={<BrainCircuit size={18} />} status="info" />
        <MetricCard title="Pending" value={stats?.pending || 0} icon={<Clock size={18} />} status={stats?.pending > 0 ? 'warning' : 'success'} />
        <MetricCard title="Approved" value={stats?.approved || 0} icon={<CheckCircle2 size={18} />} status="success" />
        <MetricCard title="Completed" value={stats?.completed || 0} icon={<Target size={18} />} status="info" />
        <MetricCard title="Avg Confidence" value={`${stats?.avg_confidence || 0}%`} icon={<Shield size={18} />} status="success" sparkline={[72, 75, 78, 80, 82, 84, stats?.avg_confidence || 85]} />
      </div>

      {/* Charts + Pending */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Decisões por Dia" />
          </div>
          <CardContent className="p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="decisions" name="Decisões" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Aprovadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Pendentes de Aprovação" />
          </div>
          <CardContent className="p-4 max-h-56 overflow-y-auto">
            {pendingDecisions.length > 0 ? pendingDecisions.slice(0, 5).map((d: any) => (
              <div key={d.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors mb-2 group">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={d.urgency === 'critical' ? 'bg-red-100 text-red-800' : d.urgency === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>{d.urgency}</Badge>
                  <span className="text-sm font-medium truncate">{d.title}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{d.reasoning}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span>Confidence: {d.confidence}%</span>
                    <span>Impact: {d.impact_score}/100</span>
                  </div>
                  <button className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Aprovar</button>
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma decisão pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Decisions */}
      <Card>
        <div className="px-4 py-3 border-b border-border">
          <SectionHeader title="Decisões Recentes" />
        </div>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Decisão</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Confidence</th>
                  <th className="pb-2 font-medium">Impacto</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentDecisions.map((d: any) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 font-medium">{d.title}</td>
                    <td className="py-2.5 text-muted-foreground">{d.decision_type}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-muted rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${d.confidence}%` }} />
                        </div>
                        <span className="text-xs">{d.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-2.5">{d.impact_score}/100</td>
                    <td className="py-2.5">
                      <Badge className={d.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : d.status === 'approved' ? 'bg-blue-100 text-blue-800' : d.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}>{d.status}</Badge>
                    </td>
                    <td className="py-2.5 text-muted-foreground text-xs">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}