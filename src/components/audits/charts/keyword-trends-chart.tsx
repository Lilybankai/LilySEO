"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Keyword {
  keyword: string;
  rank: number;
  previousRank: number;
  volume: number;
  difficulty: number;
  intent: string;
  url: string;
  lastUpdated: string;
  history?: Array<{
    date: string;
    rank: number;
  }>;
}

interface KeywordTrendsChartProps {
  keywords: Keyword[];
  historyData?: {
    [keywordId: string]: Array<{
      date: string;
      rank: number;
    }>;
  };
}

// Generate unique colors for each keyword
const COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#4f46e5", // indigo-600
  "#db2777", // pink-600
  "#65a30d", // lime-600
  "#0d9488", // teal-600
];

export function KeywordTrendsChart({ keywords, historyData }: KeywordTrendsChartProps) {
  // Get top 10 keywords by volume for selection
  const topKeywords = useMemo(() => {
    return [...keywords]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
  }, [keywords]);

  // State for selected keywords (default to top 5)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(
    topKeywords.slice(0, 5).map(kw => kw.keyword)
  );

  // Toggle keyword selection
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  // Prepare chart data
  const data = useMemo(() => {
    // If we have real historical data, use it
    if (historyData) {
      // Find the earliest and latest dates across all keywords
      const allDates = new Set<string>();
      
      Object.values(historyData).forEach(history => {
        history.forEach(entry => {
          allDates.add(entry.date);
        });
      });
      
      // Sort dates chronologically
      const sortedDates = Array.from(allDates).sort();
      
      // Create data points for each date
      return sortedDates.map(date => {
        const entry: { [key: string]: any } = { date };
        
        // Add rank data for each selected keyword
        selectedKeywords.forEach(keyword => {
          const keywordObj = topKeywords.find(k => k.keyword === keyword);
          if (!keywordObj) return;
          
          const keywordHistory = historyData[keywordObj.keyword];
          if (!keywordHistory) return;
          
          const historyEntry = keywordHistory.find(h => h.date === date);
          if (historyEntry) {
            entry[keyword] = historyEntry.rank;
          }
        });
        
        return entry;
      });
    } else {
      // Use mock data if no real data is available
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });
  
      return dates.map(date => {
        const entry: { [key: string]: any } = { date };
        
        topKeywords.forEach(kw => {
          if (!selectedKeywords.includes(kw.keyword)) return;
          
          // Generate mock historical ranks between current and previous
          const currentRank = kw.rank;
          const previousRank = kw.previousRank;
          const diff = previousRank - currentRank;
          const step = diff / 6;
          
          const dayIndex = dates.indexOf(date);
          entry[kw.keyword] = Math.round(previousRank - (step * dayIndex));
        });
  
        return entry;
      });
    }
  }, [topKeywords, selectedKeywords, historyData]);

  return (
    <div className="space-y-4">
      {/* Keyword Selection */}
      <div className="flex flex-wrap gap-4">
        {topKeywords.map((kw, index) => (
          <div key={kw.keyword} className="flex items-center space-x-2">
            <Checkbox 
              id={`keyword-${index}`}
              checked={selectedKeywords.includes(kw.keyword)}
              onCheckedChange={() => toggleKeyword(kw.keyword)}
              style={{ 
                borderColor: COLORS[index % COLORS.length],
                backgroundColor: selectedKeywords.includes(kw.keyword) 
                  ? COLORS[index % COLORS.length] 
                  : 'transparent' 
              }}
            />
            <Label 
              htmlFor={`keyword-${index}`}
              className="text-sm cursor-pointer"
            >
              {kw.keyword}
            </Label>
          </div>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
            }}
          />
          <YAxis
            reversed
            domain={[1, (dataMax: number) => Math.max(100, dataMax)]}
            tickFormatter={(value) => `#${value}`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `#${value}`,
              name
            ]}
            labelFormatter={(label: string) => {
              const date = new Date(label);
              return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              });
            }}
          />
          <Legend />
          {topKeywords.map((kw, index) => {
            if (!selectedKeywords.includes(kw.keyword)) return null;
            
            return (
              <Line
                key={kw.keyword}
                type="monotone"
                dataKey={kw.keyword}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{
                  stroke: COLORS[index % COLORS.length],
                  strokeWidth: 2,
                  r: 4,
                  fill: "white"
                }}
                activeDot={{
                  stroke: COLORS[index % COLORS.length],
                  strokeWidth: 2,
                  r: 6,
                  fill: "white"
                }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 