'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface GrowthChartProps {
  data: { date: string; supply: number }[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Supply Growth</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C0C0C0" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#C0C0C0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            stroke="#555"
            style={{ fontSize: '11px' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#555"
            style={{ fontSize: '11px' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="supply"
            stroke="#C0C0C0"
            strokeWidth={2}
            fill="url(#silverGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

