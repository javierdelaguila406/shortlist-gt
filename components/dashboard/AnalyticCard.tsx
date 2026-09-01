'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AnalyticCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
}

export function AnalyticCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
}: AnalyticCardProps) {
  const isPositive = trend && trend > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
            {subtitle && <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>}
          </div>
          <div className="text-xl text-zinc-500">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-white">{value}</p>
            {trend !== undefined && (
              <div className={`mt-2 flex items-center gap-1 text-xs ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {isPositive ? '+' : ''}{trend}% {trendLabel || 'vs last month'}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
