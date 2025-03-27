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
  // Log the incoming data for debugging
  console.log('ScoreRadarChart raw data:', data);
  
  // Transform data for Recharts
  const chartData = Object.entries(data)
    .filter(([_, value]) => typeof value === 'number' && !isNaN(value)) // Filter out undefined and NaN values
    .map(([key, value]) => {
      // Format keys for display
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      
      // Ensure values are in 0-100 range and are valid numbers
      const formattedValue = Math.max(0, Math.min(100, value || 0));
      
      return {
        category: formattedKey,
        score: formattedValue,
      };
    });
  
  // Log the transformed data for debugging
  console.log('ScoreRadarChart transformed data:', chartData);

  // Make sure we have values for all expected categories
  const expectedCategories = ['onPageSeo', 'performance', 'usability', 'links', 'social'];
  const existingCategories = chartData.map(item => 
    item.category.toLowerCase().replace(/\s/g, '')
  );
  
  // Add missing categories with default values if needed
  expectedCategories.forEach(category => {
    const formattedCategory = category.replace(/([A-Z])/g, ' $1').trim();
    if (!existingCategories.includes(category.toLowerCase())) {
      chartData.push({
        category: formattedCategory,
        score: 0, // Default value for missing categories
      });
    }
  });

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