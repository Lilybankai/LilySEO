"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

interface DataItem {
  name: string;
  value: number;
}

interface CompetitorBarChartProps {
  data: DataItem[];
}

export function CompetitorBarChart({ data }: CompetitorBarChartProps) {
  // Generate a unique color for your website (the first item in data)
  const yourSiteColor = "#10b981"; // green-500
  const competitorColor = "#6366f1"; // indigo-500
  
  // Format data for Recharts
  const chartData = data.map((item) => ({
    name: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name,
    domainAuthority: item.value,
    // This property is used for the color
    isYourSite: item.name === data[0].name,
    // Pre-compute the fill color
    fill: item.name === data[0].name ? yourSiteColor : competitorColor
  }));
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          domain={[0, 100]} 
          ticks={[0, 20, 40, 60, 80, 100]}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <Card className="p-2 shadow-md border bg-background text-foreground">
                  <div className="text-sm font-medium">{data.name}</div>
                  <div className="text-sm">Domain Authority: {data.domainAuthority}</div>
                </Card>
              );
            }
            return null;
          }}
        />
        <Bar 
          dataKey="domainAuthority" 
          name="Domain Authority" 
          fill={competitorColor}  // Default fill
          fillOpacity={0.8}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
} 