'use client';

interface HealthGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function getLevel(score: number) {
  if (score >= 90) return { label: 'EXCELENTE', color: '#10b981', textColor: 'text-emerald-600' };
  if (score >= 75) return { label: 'BOM', color: '#3b82f6', textColor: 'text-blue-600' };
  if (score >= 60) return { label: 'MÉDIO', color: '#f59e0b', textColor: 'text-amber-600' };
  return { label: 'CRÍTICO', color: '#ef4444', textColor: 'text-red-600' };
}

export function HealthGauge({ score, size = 120, strokeWidth = 8 }: HealthGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const level = getLevel(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={level.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className={`text-[9px] font-bold uppercase tracking-wider ${level.textColor}`}>{level.label}</span>
        </div>
      </div>
    </div>
  );
}