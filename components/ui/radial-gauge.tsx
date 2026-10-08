import React from 'react';

interface RadialGaugeProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  subtitle?: string;
}

const sizeConfig = {
  sm: { radius: 45, strokeWidth: 8, fontSize: 24 },
  md: { radius: 70, strokeWidth: 10, fontSize: 36 },
  lg: { radius: 100, strokeWidth: 12, fontSize: 48 },
};

export function RadialGauge({
  value,
  max = 100,
  size = 'md',
  label,
  subtitle,
}: RadialGaugeProps) {
  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (value / max) * circumference;
  const center = config.radius + config.strokeWidth;

  const colorClass = value >= 80 ? 'stroke-success' : value >= 60 ? 'stroke-warning' : 'stroke-destructive';

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width={center * 2}
        height={center * 2}
        role="img"
        aria-label={`${label ?? 'Puntuación'}: ${Math.round(value)} de ${max}`}
      >
        <circle cx={center} cy={center} r={config.radius} fill="none" strokeWidth={config.strokeWidth} className="stroke-muted" />
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={colorClass}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text
          x={center}
          y={center + config.fontSize / 3}
          textAnchor="middle"
          className="fill-foreground font-semibold tabular-nums"
          fontSize={config.fontSize}
        >
          {Math.round(value)}
        </text>
      </svg>
      {label && <div className="mt-4 text-sm font-medium">{label}</div>}
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </div>
  );
}
