"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface IssuesPieChartProps {
  issues: {
    metaDescription: Array<any>;
    titleTags: Array<any>;
    headings: Array<any>;
    images: Array<any>;
    links: Array<any>;
    canonicalLinks: Array<any>;
    schemaMarkup: Array<any>;
    performance: Array<any>;
    mobile: Array<any>;
    security: Array<any>;
  };
}

const COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEEAD", // Yellow
  "#D4A5A5", // Pink
  "#9A8C98", // Purple
  "#C3B299", // Brown
  "#83A95C", // Olive
  "#FF9F1C", // Orange
];

export function IssuesPieChart({ issues }: IssuesPieChartProps) {
  // Transform data for Recharts
  const chartData = Object.entries(issues)
    .map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').trim(),
      value: value.length,
    }))
    .filter(item => item.value > 0) // Only show categories with issues
    .sort((a, b) => b.value - a.value); // Sort by value descending

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} issues
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              strokeWidth={1}
              stroke="hsl(var(--background))"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout="vertical" 
          align="right" 
          verticalAlign="middle"
          formatter={(value) => (
            <span className="text-sm">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
} 