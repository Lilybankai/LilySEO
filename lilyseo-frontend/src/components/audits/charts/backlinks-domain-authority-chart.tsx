"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";

interface Backlink {
  id: string;
  url: string;
  domain: string;
  title: string;
  anchorText: string;
  domainAuthority: number;
  pageAuthority: number;
  isDoFollow: boolean;
  firstDiscovered: string;
  lastChecked: string;
}

interface BacklinksDomainAuthorityChartProps {
  backlinks: Backlink[];
}

export function BacklinksDomainAuthorityChart({ backlinks }: BacklinksDomainAuthorityChartProps) {
  // Prepare data for the chart
  const data = useMemo(() => {
    // Define authority ranges
    const ranges = [
      { name: "0-10", min: 0, max: 10 },
      { name: "11-20", min: 11, max: 20 },
      { name: "21-30", min: 21, max: 30 },
      { name: "31-40", min: 31, max: 40 },
      { name: "41-50", min: 41, max: 50 },
      { name: "51-60", min: 51, max: 60 },
      { name: "61-70", min: 61, max: 70 },
      { name: "71-80", min: 71, max: 80 },
      { name: "81-90", min: 81, max: 90 },
      { name: "91-100", min: 91, max: 100 }
    ];

    // Count backlinks in each range
    return ranges.map(range => {
      const backlinksByRange = backlinks.filter(
        bl => bl.domainAuthority >= range.min && bl.domainAuthority <= range.max
      );

      const doFollowCount = backlinksByRange.filter(bl => bl.isDoFollow).length;
      const noFollowCount = backlinksByRange.filter(bl => !bl.isDoFollow).length;

      return {
        range: range.name,
        doFollow: doFollowCount,
        noFollow: noFollowCount,
        total: doFollowCount + noFollowCount,
        min: range.min,
        max: range.max
      };
    });
  }, [backlinks]);

  // Get color based on authority range
  const getBarColor = (min: number) => {
    if (min >= 71) return "#16a34a"; // green
    if (min >= 41) return "#ca8a04"; // yellow
    return "#dc2626"; // red
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-2">Domain Authority: {label}</p>
          <div className="space-y-1 text-sm">
            <p>Total Backlinks: <span className="font-medium">{payload[0].payload.total}</span></p>
            <p>DoFollow Links: <span className="font-medium">{payload[0].value}</span></p>
            <p>NoFollow Links: <span className="font-medium">{payload[1].value}</span></p>
          </div>
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
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="range" 
          label={{ 
            value: "Domain Authority Range", 
            position: "insideBottomRight", 
            offset: -5 
          }}
        />
        <YAxis 
          label={{ 
            value: "Number of Backlinks", 
            angle: -90, 
            position: "insideLeft" 
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="doFollow" 
          name="DoFollow Links" 
          stackId="a"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getBarColor(entry.min)} 
              fillOpacity={0.8}
            />
          ))}
        </Bar>
        <Bar 
          dataKey="noFollow" 
          name="NoFollow Links" 
          stackId="a"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getBarColor(entry.min)} 
              fillOpacity={0.4}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
} 