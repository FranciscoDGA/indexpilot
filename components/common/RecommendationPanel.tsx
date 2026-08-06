'use client';

import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Clock, Target, Zap, ArrowRight } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  impact: 'Alto' | 'Médio' | 'Baixo';
  confidence: number;
  estimatedTime?: string;
  benefit?: string;
  explanation?: string;
}

interface RecommendationPanelProps {
  recommendations?: Recommendation[];
}

const defaultRecs: Recommendation[] = [
  {
    id: '1',
    title: 'Atualizar artigo: Indexação Google',
    impact: 'Alto',
    confidence: 96,
    estimatedTime: '30 min',
    benefit: 'Potencial de +15% em tráfego orgânico',
    explanation: '12 URLs estão bloqueadas pelo robots.txt. Isso pode reduzir em aproximadamente 18% a descoberta de novas páginas. Corrigir esse arquivo tende a melhorar a cobertura de indexação.',
  },
  {
    id: '2',
    title: 'Corrigir robots.txt bloqueando imagens',
    impact: 'Alto',
    confidence: 92,
    estimatedTime: '10 min',
    benefit: 'Desbloqueio de 8 páginas de produto',
    explanation: 'A diretiva Disallow está impedindo o Googlebot de acessar seções importantes do site. A correção é simples e o impacto é imediato.',
  },
  {
    id: '3',
    title: 'Adicionar Schema FAQ nas páginas de produto',
    impact: 'Médio',
    confidence: 87,
    estimatedTime: '2h',
    benefit: 'Aumento de visibilidade no SERP com rich results',
    explanation: 'Páginas de produto sem Schema FAQ perdem oportunidades de rich snippets. Adicionar o markup pode aumentar o CTR em até 25%.',
  },
  {
    id: '4',
    title: 'Criar cluster de conteúdo: SEO técnico',
    impact: 'Médio',
    confidence: 84,
    estimatedTime: '1 semana',
    benefit: 'Consolidação de autoridade no tópico',
    explanation: 'O cluster de SEO técnico está incompleto com apenas 3 de 8 artigos planejados. Completar o cluster melhora a autoridade semântica do domínio.',
  },
];

const impactColors = {
  Alto: 'bg-red-100 text-red-700 border-red-200',
  Médio: 'bg-amber-100 text-amber-700 border-amber-200',
  Baixo: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function RecommendationPanel({ recommendations = defaultRecs }: RecommendationPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {recommendations.map(rec => (
        <div key={rec.id} className="rounded-xl border border-border bg-card p-3.5 transition-all hover:shadow-md hover:border-primary/20 group">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1.5">{rec.title}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${impactColors[rec.impact]}`}>{rec.impact}</span>
                <span className="text-[10px] text-muted-foreground">Confiança {rec.confidence}%</span>
                {rec.estimatedTime && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock size={10} /> {rec.estimatedTime}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
              className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
            >
              Explicar
              {expanded === rec.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          {rec.benefit && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Target size={10} className="text-emerald-500" />
              <span>{rec.benefit}</span>
            </div>
          )}
          {expanded === rec.id && rec.explanation && (
            <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-1">
              <div className="flex items-start gap-2">
                <Brain size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <span>{rec.explanation}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}