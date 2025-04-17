"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";

interface CoreWebVitalsChartProps {
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

export function CoreWebVitalsChart({ mobile, desktop }: CoreWebVitalsChartProps) {
  // Calculate scores (0-100) based on Core Web Vitals thresholds
  const calculateScore = (value: number, metric: string) => {
    const thresholds = {
      firstContentfulPaint: { good: 1800, poor: 3000 },
      speedIndex: { good: 3400, poor: 5800 },
      largestContentfulPaint: { good: 2500, poor: 4000 },
      timeToInteractive: { good: 3800, poor: 7300 },
      totalBlockingTime: { good: 200, poor: 600 },
      cumulativeLayoutShift: { good: 0.1, poor: 0.25 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 0;

    if (value <= threshold.good) return 100;
    if (value >= threshold.poor) return 0;

    // Linear interpolation between good and poor thresholds
    return Math.round(
      100 - ((value - threshold.good) / (threshold.poor - threshold.good)) * 100
    );
  };

  // Transform data for Recharts
  const data = [
    {
      metric: "FCP",
      mobile: calculateScore(mobile.firstContentfulPaint, "firstContentfulPaint"),
      desktop: calculateScore(desktop.firstContentfulPaint, "firstContentfulPaint"),
      fullName: "First Contentful Paint",
    },
    {
      metric: "SI",
      mobile: calculateScore(mobile.speedIndex, "speedIndex"),
      desktop: calculateScore(desktop.speedIndex, "speedIndex"),
      fullName: "Speed Index",
    },
    {
      metric: "LCP",
      mobile: calculateScore(mobile.largestContentfulPaint, "largestContentfulPaint"),
      desktop: calculateScore(desktop.largestContentfulPaint, "largestContentfulPaint"),
      fullName: "Largest Contentful Paint",
    },
    {
      metric: "TTI",
      mobile: calculateScore(mobile.timeToInteractive, "timeToInteractive"),
      desktop: calculateScore(desktop.timeToInteractive, "timeToInteractive"),
      fullName: "Time to Interactive",
    },
    {
      metric: "TBT",
      mobile: calculateScore(mobile.totalBlockingTime, "totalBlockingTime"),
      desktop: calculateScore(desktop.totalBlockingTime, "totalBlockingTime"),
      fullName: "Total Blocking Time",
    },
    {
      metric: "CLS",
      mobile: calculateScore(mobile.cumulativeLayoutShift, "cumulativeLayoutShift"),
      desktop: calculateScore(desktop.cumulativeLayoutShift, "cumulativeLayoutShift"),
      fullName: "Cumulative Layout Shift",
    },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const metric = data.find(d => d.metric === label);
      return (
        <div className="bg-background border border-border rounded-lg p-3">
          <p className="text-sm font-medium mb-2">{metric?.fullName}</p>
          {payload.map((entry: any) => (
            <p
              key={entry.name}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value.toFixed(0)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
        />
        <Radar
          name="Mobile"
          dataKey="mobile"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.6}
        />
        <Radar
          name="Desktop"
          dataKey="desktop"
          stroke="hsl(var(--secondary))"
          fill="hsl(var(--secondary))"
          fillOpacity={0.6}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
} 