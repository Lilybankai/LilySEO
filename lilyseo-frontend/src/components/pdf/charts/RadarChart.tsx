import React from 'react';
import { View, Svg, Path, Text, G } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';
import { safeHslToHex } from '@/utils';

interface RadarChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  width?: number;
  height?: number;
  maxValue?: number;
  backgroundColor?: string;
  showLabels?: boolean;
  showValues?: boolean;
}

const RadarChart: React.FC<RadarChartProps> = ({
  data,
  width = 200,
  height = 200,
  maxValue = 100,
  backgroundColor = '#ffffff',
  showLabels = true,
  showValues = true,
}) => {
  const { theme } = usePdfTheme();
  
  // Process theme colors to ensure they're in HEX format
  const processedPrimaryColor = theme.primaryColor?.startsWith('hsl') 
    ? safeHslToHex(theme.primaryColor, '#3b82f6')
    : theme.primaryColor || '#3b82f6';
    
  const processedSecondaryColor = theme.secondaryColor?.startsWith('hsl') 
    ? safeHslToHex(theme.secondaryColor, '#64748b')
    : theme.secondaryColor || '#64748b';
  
  // Calculate center points
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Define the radius of the chart (smaller than half the width/height)
  const radius = Math.min(width, height) * 0.4;
  
  // Calculate points on the radar chart
  const angleStep = (2 * Math.PI) / data.length;
  
  // Create the data points for the radar chart
  const points = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from the top (subtract 90 degrees)
    const value = Math.min(item.value, maxValue) / maxValue; // Normalize the value
    const x = centerX + radius * value * Math.cos(angle);
    const y = centerY + radius * value * Math.sin(angle);
    return { x, y, value: item.value, label: item.label, angle };
  });
  
  // Create the path for the radar shape
  const radarPath = points.reduce((path, point, index) => {
    return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
  }, '') + ' Z'; // Close the path
  
  // Create axis lines and circles
  const axisLines = points.map((point, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return `M ${centerX} ${centerY} L ${x} ${y}`;
  });
  
  // Create concentric circles for the background grid (25%, 50%, 75%, 100%)
  const gridCircles = [0.25, 0.5, 0.75, 1].map((value) => {
    const gridRadius = radius * value;
    return `M ${centerX + gridRadius} ${centerY} 
            A ${gridRadius} ${gridRadius} 0 0 1 ${centerX} ${centerY + gridRadius}
            A ${gridRadius} ${gridRadius} 0 0 1 ${centerX - gridRadius} ${centerY}
            A ${gridRadius} ${gridRadius} 0 0 1 ${centerX} ${centerY - gridRadius}
            A ${gridRadius} ${gridRadius} 0 0 1 ${centerX + gridRadius} ${centerY}`;
  });
  
  return (
    <View style={{ width, height, backgroundColor }}>
      <Svg width={width} height={height}>
        {/* Background concentric circles */}
        {gridCircles.map((circlePath, index) => (
          <Path
            key={`grid-circle-${index}`}
            d={circlePath}
            stroke={`rgba(0, 0, 0, ${0.1 + index * 0.05})`}
            strokeWidth={0.5}
            fill="none"
          />
        ))}
        
        {/* Axis lines */}
        {axisLines.map((axisPath, index) => (
          <Path
            key={`axis-${index}`}
            d={axisPath}
            stroke={`rgba(0, 0, 0, 0.2)`}
            strokeWidth={0.5}
            fill="none"
          />
        ))}
        
        {/* Radar shape */}
        <Path
          d={radarPath}
          stroke={processedPrimaryColor}
          strokeWidth={2}
          fill={`${processedPrimaryColor}40`} // 25% opacity
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <G key={`point-${index}`}>
            <Path
              d={`M ${point.x - 3} ${point.y} a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`}
              fill={processedPrimaryColor}
            />
            
            {showValues && (
              <Text
                x={point.x + (point.angle > 0 && point.angle < Math.PI ? 8 : -8)}
                y={point.y + 4}
                style={{
                  fontSize: 8,
                  textAnchor: point.angle > 0 && point.angle < Math.PI ? 'start' : 'end',
                  fill: processedSecondaryColor,
                }}
              >
                {Math.round(point.value)}
              </Text>
            )}
            
            {showLabels && (
          <Text
                x={centerX + (radius + 15) * Math.cos(point.angle)}
                y={centerY + (radius + 15) * Math.sin(point.angle) + 3}
            style={{
                  fontSize: 8,
                  textAnchor: 
                    point.angle > -Math.PI/4 && point.angle < Math.PI/4 ? 'middle' :
                    point.angle >= Math.PI/4 && point.angle <= 3*Math.PI/4 ? 'start' :
                    point.angle > 3*Math.PI/4 || point.angle < -3*Math.PI/4 ? 'middle' : 'end',
                  fill: processedSecondaryColor,
                }}
              >
                {point.label}
          </Text>
            )}
          </G>
        ))}
      </Svg>
    </View>
  );
};

export default RadarChart; 