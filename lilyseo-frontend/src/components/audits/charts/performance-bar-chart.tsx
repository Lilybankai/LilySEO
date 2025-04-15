"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface PerformanceBarChartProps {
  mobile: {
    firstContentfulPaint: number;
    speedIndex: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
  desktop: {
    firstContentfulPaint: number;
    speedIndex: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
}

export function PerformanceBarChart({ mobile, desktop }: PerformanceBarChartProps) {
  // Transform data for Recharts
  const data = [
    {
      name: "First Contentful Paint",
      mobile: mobile.firstContentfulPaint,
      desktop: desktop.firstContentfulPaint,
    },
    {
      name: "Speed Index",
      mobile: mobile.speedIndex,
      desktop: desktop.speedIndex,
    },
    {
      name: "Largest Contentful Paint",
      mobile: mobile.largestContentfulPaint,
      desktop: desktop.largestContentfulPaint,
    },
    {
      name: "Time to Interactive",
      mobile: mobile.timeToInteractive,
      desktop: desktop.timeToInteractive,
    },
    {
      name: "Total Blocking Time",
      mobile: mobile.totalBlockingTime,
      desktop: desktop.totalBlockingTime,
    },
  ];

  // Format milliseconds for tooltip
  const formatTime = (value: number) => {
    if (value < 1000) return `${value.toFixed(1)}ms`;
    return `${(value / 1000).toFixed(1)}s`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any) => (
            <p
              key={entry.name}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatTime(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
          tickFormatter={formatTime}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          name="Mobile"
          dataKey="mobile"
          fill="hsl(var(--primary))"
          fillOpacity={0.8}
        />
        <Bar
          name="Desktop"
          dataKey="desktop"
          fill="hsl(var(--secondary))"
          fillOpacity={0.8}
        />
      </BarChart>
    </ResponsiveContainer>
  );
} 