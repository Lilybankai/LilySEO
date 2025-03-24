"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";

interface ScoreRadarChartProps {
  data: {
    onPageSeo: number;
    performance: number;
    usability: number;
    links: number;
    social: number;
  };
}

export function ScoreRadarChart({ data }: ScoreRadarChartProps) {
  // Transform data for Recharts
  const chartData = Object.entries(data).map(([key, value]) => ({
    category: key.replace(/([A-Z])/g, ' $1').trim(),
    score: value,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
        <PolarGrid />
        <PolarAngleAxis 
          dataKey="category" 
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
        />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]} 
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.6}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
          labelStyle={{
            color: "hsl(var(--foreground))",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
} 