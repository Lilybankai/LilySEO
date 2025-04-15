"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line
} from "recharts";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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

interface KeywordDistributionChartProps {
  keywords: Keyword[];
  onExportData?: (data: any) => void;
}

export function KeywordDistributionChart({ keywords, onExportData }: KeywordDistributionChartProps) {
  // Default date range (last 30 days)
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  // Filter keywords by date range
  const filteredKeywords = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return keywords;
    
    return keywords.filter(kw => {
      const updatedDate = new Date(kw.lastUpdated);
      const isAfterFrom = !dateRange.from || updatedDate >= dateRange.from;
      const isBeforeTo = !dateRange.to || updatedDate <= dateRange.to;
      return isAfterFrom && isBeforeTo;
    });
  }, [keywords, dateRange]);

  // Calculate distribution data
  const data = useMemo(() => {
    const intents = Array.from(new Set(filteredKeywords.map(kw => kw.intent)));
    
    return intents.map(intent => {
      const intentKeywords = filteredKeywords.filter(kw => kw.intent === intent);
      const totalKeywords = intentKeywords.length;
      
      // Calculate average difficulty for the line chart
      const avgDifficulty = totalKeywords > 0
        ? intentKeywords.reduce((acc, kw) => acc + kw.difficulty, 0) / totalKeywords
        : 0;

      // Calculate difficulty distribution
      const easy = intentKeywords.filter(kw => kw.difficulty <= 30).length;
      const medium = intentKeywords.filter(kw => kw.difficulty > 30 && kw.difficulty <= 60).length;
      const hard = intentKeywords.filter(kw => kw.difficulty > 60).length;

      return {
        intent,
        easy,
        medium,
        hard,
        avgDifficulty,
        total: totalKeywords
      };
    }).sort((a, b) => b.total - a.total); // Sort by total keywords
  }, [filteredKeywords]);

  // Handle export data
  const handleExportData = () => {
    if (onExportData) {
      onExportData(data);
    } else {
      // Default export as CSV if no handler provided
      const headers = ["Intent", "Easy", "Medium", "Hard", "Average Difficulty", "Total"];
      const csvContent = [
        headers.join(","),
        ...data.map(item => [
          item.intent,
          item.easy,
          item.medium,
          item.hard,
          item.avgDifficulty.toFixed(2),
          item.total
        ].join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `keyword-distribution-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <DatePickerWithRange 
          date={dateRange} 
          onDateChange={setDateRange} 
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportData}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="intent"
            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            label={{
              value: "Number of Keywords",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" }
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            label={{
              value: "Average Difficulty",
              angle: 90,
              position: "insideRight",
              style: { textAnchor: "middle" }
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              switch (name) {
                case "easy":
                  return [`${value} keywords`, "Easy (0-30)"];
                case "medium":
                  return [`${value} keywords`, "Medium (31-60)"];
                case "hard":
                  return [`${value} keywords`, "Hard (61-100)"];
                case "avgDifficulty":
                  return [`${value.toFixed(1)}`, "Average Difficulty"];
                default:
                  return [value, name];
              }
            }}
            labelFormatter={(label: string) => {
              return label.charAt(0).toUpperCase() + label.slice(1);
            }}
          />
          <Legend
            formatter={(value: string) => {
              switch (value) {
                case "easy":
                  return "Easy (0-30)";
                case "medium":
                  return "Medium (31-60)";
                case "hard":
                  return "Hard (61-100)";
                case "avgDifficulty":
                  return "Average Difficulty";
                default:
                  return value;
              }
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="easy"
            stackId="difficulty"
            fill="#16a34a"
            opacity={0.8}
          />
          <Bar
            yAxisId="left"
            dataKey="medium"
            stackId="difficulty"
            fill="#ea580c"
            opacity={0.8}
          />
          <Bar
            yAxisId="left"
            dataKey="hard"
            stackId="difficulty"
            fill="#dc2626"
            opacity={0.8}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgDifficulty"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{
              stroke: "#2563eb",
              strokeWidth: 2,
              r: 4,
              fill: "white"
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
} 