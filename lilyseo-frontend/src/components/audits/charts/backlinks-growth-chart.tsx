"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
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

interface BacklinksGrowthChartProps {
  backlinks: Backlink[];
}

export function BacklinksGrowthChart({ backlinks }: BacklinksGrowthChartProps) {
  // Prepare data for the chart
  const data = useMemo(() => {
    // Sort backlinks by discovery date
    const sortedBacklinks = [...backlinks].sort(
      (a, b) => new Date(a.firstDiscovered).getTime() - new Date(b.firstDiscovered).getTime()
    );

    // Get the earliest and latest dates
    if (sortedBacklinks.length === 0) {
      return [];
    }

    const earliestDate = new Date(sortedBacklinks[0].firstDiscovered);
    const latestDate = new Date();
    
    // Create monthly data points
    const monthlyData = [];
    let currentDate = new Date(earliestDate);
    currentDate.setDate(1); // Start at the beginning of the month
    
    let totalBacklinks = 0;
    let totalDoFollow = 0;
    let totalNoFollow = 0;
    let currentIndex = 0;
    
    while (currentDate <= latestDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const endOfMonth = new Date(year, month, lastDayOfMonth);
      
      // Count backlinks discovered this month
      let newBacklinks = 0;
      let newDoFollow = 0;
      let newNoFollow = 0;
      
      while (
        currentIndex < sortedBacklinks.length && 
        new Date(sortedBacklinks[currentIndex].firstDiscovered) <= endOfMonth
      ) {
        const backlink = sortedBacklinks[currentIndex];
        newBacklinks++;
        if (backlink.isDoFollow) {
          newDoFollow++;
        } else {
          newNoFollow++;
        }
        currentIndex++;
      }
      
      totalBacklinks += newBacklinks;
      totalDoFollow += newDoFollow;
      totalNoFollow += newNoFollow;
      
      monthlyData.push({
        date: currentDate.toISOString().split('T')[0],
        total: totalBacklinks,
        doFollow: totalDoFollow,
        noFollow: totalNoFollow,
        new: newBacklinks
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return monthlyData;
  }, [backlinks]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-2">{formattedDate}</p>
          <div className="space-y-1 text-sm">
            <p>Total Backlinks: <span className="font-medium">{payload[0].value}</span></p>
            <p>DoFollow Links: <span className="font-medium">{payload[1].value}</span></p>
            <p>NoFollow Links: <span className="font-medium">{payload[2].value}</span></p>
            <p>New This Month: <span className="font-medium">{payload[3].value}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric'
            });
          }}
          minTickGap={50}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="total" 
          stackId="1" 
          stroke="#2563eb" 
          fill="#2563eb" 
          fillOpacity={0.6}
          name="Total Backlinks"
        />
        <Area 
          type="monotone" 
          dataKey="doFollow" 
          stackId="2" 
          stroke="#16a34a" 
          fill="#16a34a" 
          fillOpacity={0.6}
          name="DoFollow Links"
        />
        <Area 
          type="monotone" 
          dataKey="noFollow" 
          stackId="2" 
          stroke="#dc2626" 
          fill="#dc2626" 
          fillOpacity={0.6}
          name="NoFollow Links"
        />
        <Area 
          type="monotone" 
          dataKey="new" 
          stackId="3" 
          stroke="#9333ea" 
          fill="#9333ea" 
          fillOpacity={0.6}
          name="New This Month"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 