import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface CustomChartProps {
  type: 'line' | 'bar';
  data: DataPoint[];
  color?: 'cyan' | 'pink' | 'green';
  height?: number;
}

export const CustomChart: React.FC<CustomChartProps> = ({ 
  type, 
  data, 
  color = 'cyan', 
  height = 200 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted">
        No data available
      </div>
    );
  }

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values, 100); // minimum scale limit
  const neonColor = color === 'cyan' ? '#00f2fe' : color === 'pink' ? '#ff007f' : '#00ff87';
  const glowShadow = color === 'cyan' ? 'rgba(0, 242, 254, 0.4)' : color === 'pink' ? 'rgba(255, 0, 127, 0.4)' : 'rgba(0, 255, 87, 0.4)';

  if (type === 'line') {
    // Width is 500, height is variable
    const width = 500;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Generate points coordinates
    const points = data.map((dp, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = height - padding - (dp.value / maxValue) * chartHeight;
      return { x, y, ...dp };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Area path for gradient fill under the line
    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={neonColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={neonColor} stopOpacity="0.0" />
            </linearGradient>
            <filter id={`glow-${color}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={neonColor} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding + ratio * chartHeight;
            const val = Math.round(maxValue * (1 - ratio));
            return (
              <g key={i} opacity="0.15">
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  stroke="#ffffff" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={padding - 8} 
                  y={y + 4} 
                  fill="#ffffff" 
                  fontSize="10" 
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area under the path */}
          {areaD && <path d={areaD} fill={`url(#grad-${color})`} />}

          {/* The line graph path */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke={neonColor} 
              strokeWidth="3" 
              filter={`url(#glow-${color})`}
            />
          )}

          {/* Interactive dots and text */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="5" 
                fill={neonColor} 
                stroke="#060919" 
                strokeWidth="2" 
              />
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="10" 
                fill={neonColor} 
                opacity="0" 
                className="hover:opacity-20 transition-opacity"
              />
              
              {/* Tooltip value */}
              <text 
                x={p.x} 
                y={p.y - 12} 
                fill="#ffffff" 
                fontSize="11" 
                fontWeight="bold"
                textAnchor="middle"
                opacity="0.9"
              >
                ${p.value}
              </text>

              {/* X Axis labels */}
              <text 
                x={p.x} 
                y={height - padding + 20} 
                fill="rgba(255, 255, 255, 0.5)" 
                fontSize="10" 
                textAnchor="middle"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  // Vertical Bar Chart
  return (
    <div className="flex flex-col gap-3 py-2 w-full">
      {data.map((dp, i) => {
        const pct = Math.max(5, (dp.value / maxValue) * 100);
        return (
          <div key={i} className="flex flex-col gap-1 w-full">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>{dp.label}</span>
              <span className="font-semibold text-white">${dp.value}</span>
            </div>
            <div className="w-full h-3 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${pct}%`,
                  backgroundColor: neonColor,
                  boxShadow: `0 0 10px ${glowShadow}`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
