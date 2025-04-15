import React from 'react';
import { View, Svg, Path, Text, G } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';
import { safeHslToHex } from '@/utils';

interface DonutChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  backgroundColor?: string;
  showLabels?: boolean;
  showValues?: boolean;
  showTotal?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  width = 200,
  height = 200,
  innerRadius = 40,
  outerRadius = 70,
  backgroundColor = '#ffffff',
  showLabels = true,
  showValues = true,
  showTotal = true,
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
  
  // Calculate total value for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Function to create an SVG arc path
  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    // Convert angles from degrees to radians
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    
    // Calculate start and end points
    const x1 = centerX + radius * Math.cos(start);
    const y1 = centerY + radius * Math.sin(start);
    const x2 = centerX + radius * Math.cos(end);
    const y2 = centerY + radius * Math.sin(end);
    
    // Determine the large arc flag (1 if the angle is greater than 180 degrees)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    // Create the path
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };
  
  // Create the donut segments
  let currentAngle = -90; // Start from the top
  const segments = data.map((item, index) => {
    if (item.value === 0) return null; // Skip zero values
    
    // Calculate angle for this segment
    const angle = (item.value / total) * 360;
    
    // Create outer and inner arcs
    const outerArc = createArc(currentAngle, currentAngle + angle, outerRadius);
    const innerArc = createArc(currentAngle + angle, currentAngle, innerRadius);
    
    // Create the complete path for the segment
    const path = `${outerArc} L ${centerX + innerRadius * Math.cos((currentAngle + angle) * Math.PI / 180)} ${centerY + innerRadius * Math.sin((currentAngle + angle) * Math.PI / 180)} ${innerArc} Z`;
    
    // Calculate text position for label (middle of the segment)
    const labelAngle = currentAngle + angle / 2;
    const labelRadius = (innerRadius + outerRadius) / 2;
    const labelX = centerX + labelRadius * Math.cos(labelAngle * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin(labelAngle * Math.PI / 180);
    
    // Calculate percentage
    const percentage = Math.round((item.value / total) * 100);
    
    // Save current angle for next segment
    const segmentStartAngle = currentAngle;
    currentAngle += angle;
    
    return {
      path,
      color: item.color,
      label: item.label,
      value: item.value,
      percentage,
      labelX,
      labelY,
      labelAngle,
      segmentStartAngle,
      segmentEndAngle: currentAngle
    };
  }).filter(Boolean);
  
  // Create label lines and texts for each segment
  const labelElements = segments.map((segment, index) => {
    if (!segment) return null;
    
    // For small segments, position labels outside the chart
    const shouldPositionOutside = segment.percentage < 10;
    
    // Calculate label position
    let labelX = segment.labelX;
    let labelY = segment.labelY;
    let lineEndX = labelX;
    let lineEndY = labelY;
    
    // For outside labels, extend to the edge
    if (shouldPositionOutside) {
      // Calculate extension factor based on angle
      const labelAngleRad = (segment.labelAngle * Math.PI) / 180;
      const extensionFactor = 1.3; // How far outside the chart
      
      // Extend the label position
      labelX = centerX + outerRadius * extensionFactor * Math.cos(labelAngleRad);
      labelY = centerY + outerRadius * extensionFactor * Math.sin(labelAngleRad);
      
      // Line will go from segment to label
      lineEndX = centerX + outerRadius * 1.1 * Math.cos(labelAngleRad);
      lineEndY = centerY + outerRadius * 1.1 * Math.sin(labelAngleRad);
    }
    
    // Determine text anchor based on position
    let textAnchor: 'middle' | 'start' | 'end' = 'middle';
    if (labelX < centerX - 5) textAnchor = 'end';
    else if (labelX > centerX + 5) textAnchor = 'start';
    
    return {
      ...segment,
      labelX,
      labelY,
      lineEndX,
      lineEndY,
      textAnchor,
      shouldPositionOutside
    };
  });
  
  return (
    <View style={{ width, height, backgroundColor }}>
      <Svg width={width} height={height}>
        {/* Donut segments */}
        {segments.map((segment, i) => {
          if (!segment) return null;
          return (
            <Path
              key={`segment-${i}`}
              d={segment.path}
              fill={segment.color}
              stroke="#ffffff"
              strokeWidth={1}
            />
          );
        })}
        
        {/* Connecting lines for outside labels */}
        {showLabels && labelElements.map((label, i) => {
          if (!label || !label.shouldPositionOutside) return null;
          
          return (
            <Path
              key={`line-${i}`}
              d={`M ${label.labelX} ${label.labelY} L ${label.lineEndX} ${label.lineEndY}`}
              stroke={label.color}
              strokeWidth={1}
              opacity={0.7}
            />
          );
        })}
        
        {/* Labels */}
        {showLabels && labelElements.map((label, i) => {
          if (!label) return null;
          
          const labelContent = showValues
            ? `${label.label} (${label.percentage}%)`
            : label.label;
          
          return (
            <G key={`label-${i}`}>
              <Text
                x={label.labelX}
                y={label.labelY + 3} // Adjust for better vertical alignment
                style={{
                  fontSize: 8,
                  textAnchor: label.textAnchor,
                  fontWeight: 'bold',
                  fill: label.shouldPositionOutside ? label.color : '#ffffff',
                }}
              >
                {labelContent}
              </Text>
            </G>
          );
        })}
        
        {/* Total in the center */}
        {showTotal && (
          <G>
            <Text
              x={centerX}
              y={centerY - 8}
              style={{
                fontSize: 10,
                textAnchor: 'middle',
                fill: processedSecondaryColor,
              }}
            >
              Total
            </Text>
            <Text
              x={centerX}
              y={centerY + 8}
              style={{
                fontSize: 16,
                textAnchor: 'middle',
                fontWeight: 'bold',
                fill: processedPrimaryColor,
              }}
            >
              {total}
            </Text>
          </G>
        )}
      </Svg>
    </View>
  );
};

export default DonutChart; 