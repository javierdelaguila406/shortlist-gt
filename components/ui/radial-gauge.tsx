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

  const getColor = () => {
    if (value >= 80) return '#10b981'; // Emerald
    if (value >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Rose
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width={config.radius * 2 + config.strokeWidth * 2}
        height={config.radius * 2 + config.strokeWidth * 2}
        className="drop-shadow-lg"
      >
        {/* Background circle */}
        <circle
          cx={config.radius + config.strokeWidth}
          cy={config.radius + config.strokeWidth}
          r={config.radius}
          fill="none"
          stroke="rgba(161, 161, 170, 0.1)"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={config.radius + config.strokeWidth}
          cy={config.radius + config.strokeWidth}
          r={config.radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          transform={`rotate(-90 ${config.radius + config.strokeWidth} ${config.radius + config.strokeWidth})`}
        />
        {/* Center text */}
        <text
          x={config.radius + config.strokeWidth}
          y={config.radius + config.strokeWidth + config.fontSize / 3}
          textAnchor="middle"
          fill="rgb(244, 245, 247)"
          fontSize={config.fontSize}
          fontWeight="bold"
        >
          {Math.round(value)}
        </text>
      </svg>
      {label && <div className="mt-4 text-sm font-semibold text-zinc-300">{label}</div>}
      {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
    </div>
  );
}
