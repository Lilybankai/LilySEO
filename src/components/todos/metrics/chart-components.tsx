"use client";

import React, { SVGProps } from 'react';

// Simple Area Chart
export interface SimpleAreaChartProps {
  data: { name: string; value: number }[];
  width?: number;
  height?: number;
  color?: string;
}

export function SimpleAreaChart({
  data,
  width = 300,
  height = 100,
  color = '#3b82f6',
}: SimpleAreaChartProps) {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value), 0);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue;
  
  // Avoid division by zero
  const normalizeY = (value: number) => 
    range === 0 ? height / 2 : height - ((value - minValue) / range) * height;
  
  const xStep = width / (data.length - 1);
  
  // Create the path
  let pathD = `M 0,${normalizeY(data[0].value)} `;
  data.forEach((point, i) => {
    if (i === 0) return;
    pathD += `L ${i * xStep},${normalizeY(point.value)} `;
  });
  
  // Add bottom line for area
  pathD += `L ${width},${height} L 0,${height} Z`;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Area */}
      <path
        d={pathD}
        fill={`${color}20`} // Color with 20% opacity
        stroke="none"
      />
      
      {/* Line */}
      <path
        d={pathD.split('L')[0] + data.slice(1).map((point, i) => 
          `L ${(i + 1) * xStep},${normalizeY(point.value)}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      
      {/* Points */}
      {data.map((point, i) => (
        <circle
          key={i}
          cx={i * xStep}
          cy={normalizeY(point.value)}
          r={3}
          fill={color}
        />
      ))}
    </svg>
  );
}

// Simple Bar Chart
export interface SimpleBarChartProps {
  data: { name: string; value: number; color?: string }[];
  width?: number;
  height?: number;
  defaultColor?: string;
}

export function SimpleBarChart({
  data,
  width = 300,
  height = 150,
  defaultColor = '#3b82f6',
}: SimpleBarChartProps) {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value), 10);
  const barWidth = (width / data.length) * 0.8;
  const barGap = (width / data.length) * 0.2;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * height;
        const x = i * (barWidth + barGap);
        const y = height - barHeight;
        
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={item.color || defaultColor}
            rx={2}
          />
        );
      })}
    </svg>
  );
}

// Pre-styled bar list component
export function BarList({ data, maxBars = 10 }: { 
  data: { name: string; value: number; color?: string }[];
  maxBars?: number; 
}) {
  // Ensure we're not trying to show too many bars
  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map(d => d.value), 10);
  
  return (
    <div className="flex items-end justify-between h-full w-full gap-2">
      {displayData.map((item, index) => (
        <div 
          key={index} 
          className="flex flex-col items-center"
          style={{ width: `${100 / displayData.length}%` }}
        >
          <div 
            className={`${item.color || 'bg-blue-500'} w-full rounded-t-sm transition-all duration-300`}
            style={{ 
              height: `${Math.max((item.value / maxValue) * 100, 4)}%`, 
              minHeight: '4px'
            }}
          />
          <div className="mt-2 text-xs text-center truncate w-full text-muted-foreground">
            {item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name}
          </div>
        </div>
      ))}
    </div>
  );
} 