"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Keyword {
  keyword: string;
  rank: number;
  previousRank: number;
  volume: number;
  difficulty: number;
  intent: string;
  url: string;
  lastUpdated: string;
}

interface KeywordScatterChartProps {
  keywords: Keyword[];
}

// Color mapping for different intents
const INTENT_COLORS = {
  informational: "#2563eb", // blue
  transactional: "#16a34a", // green
  navigational: "#9333ea", // purple
  commercial: "#ea580c", // orange
  default: "#6b7280", // gray
};

export function KeywordScatterChart({ keywords }: KeywordScatterChartProps) {
  const [colorBy, setColorBy] = useState<"intent" | "rank">("intent");
  
  // Transform data for the scatter chart
  const data = useMemo(() => {
    return keywords.map(kw => ({
      keyword: kw.keyword,
      x: kw.volume,
      y: kw.difficulty,
      z: 1, // Size factor
      rank: kw.rank,
      intent: kw.intent,
      url: kw.url,
    }));
  }, [keywords]);

  // Get color based on selected attribute
  const getPointColor = (entry: any) => {
    if (colorBy === "intent") {
      return INTENT_COLORS[entry.intent as keyof typeof INTENT_COLORS] || INTENT_COLORS.default;
    } else {
      // Color by rank (gradient from green to red)
      if (entry.rank <= 10) return "#16a34a"; // green
      if (entry.rank <= 20) return "#65a30d"; // lime
      if (entry.rank <= 30) return "#ca8a04"; // yellow
      if (entry.rank <= 50) return "#ea580c"; // orange
      return "#dc2626"; // red
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-1">{data.keyword}</p>
          <div className="space-y-1 text-sm">
            <p>Volume: <span className="font-medium">{data.x.toLocaleString()}</span></p>
            <p>Difficulty: <span className="font-medium">{data.y}</span></p>
            <p>Rank: <span className="font-medium">#{data.rank}</span></p>
            <p>Intent: <span className="font-medium">{data.intent}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Legend for intent colors
  const renderIntentLegend = () => {
    if (colorBy !== "intent") return null;
    
    return (
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {Object.entries(INTENT_COLORS).map(([intent, color]) => {
          if (intent === "default") return null;
          return (
            <div key={intent} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm capitalize">{intent}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Legend for rank colors
  const renderRankLegend = () => {
    if (colorBy !== "rank") return null;
    
    const rankRanges = [
      { range: "1-10", color: "#16a34a" },
      { range: "11-20", color: "#65a30d" },
      { range: "21-30", color: "#ca8a04" },
      { range: "31-50", color: "#ea580c" },
      { range: "51+", color: "#dc2626" },
    ];
    
    return (
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {rankRanges.map((item) => (
          <div key={item.range} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">Rank {item.range}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={colorBy}
          onValueChange={(value: "intent" | "rank") => setColorBy(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Color by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="intent">Color by Intent</SelectItem>
            <SelectItem value="rank">Color by Rank</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Volume" 
            label={{ 
              value: "Search Volume", 
              position: "insideBottomRight", 
              offset: -5 
            }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Difficulty" 
            label={{ 
              value: "Keyword Difficulty", 
              angle: -90, 
              position: "insideLeft" 
            }}
            domain={[0, 100]}
          />
          <ZAxis 
            type="number" 
            dataKey="z" 
            range={[60, 60]} 
            scale="linear" 
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Keywords" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getPointColor(entry)} 
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Render appropriate legend based on colorBy selection */}
      {colorBy === "intent" ? renderIntentLegend() : renderRankLegend()}
    </div>
  );
} 