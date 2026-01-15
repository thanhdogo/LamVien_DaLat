
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartDataItem } from '../types';

interface PieChartWidgetProps {
  title: string;
  data: ChartDataItem[];
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const PieChartWidget: React.FC<PieChartWidgetProps> = ({ title, data }) => {
  return (
    <div className="flex flex-col items-center h-full w-full">
      <h3 className="text-lg font-black mb-2 text-slate-800 tracking-tighter border-b-2 border-slate-50 pb-2 w-full text-center uppercase drop-shadow-sm">{title}</h3>
      <div className="w-full h-full min-h-[220px] flex justify-center items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value }) => `${name}`}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2}
                  className="drop-shadow-md transition-all duration-500 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '900'
                }}
                itemStyle={{ color: '#1e293b' }}
                cursor={{ fill: 'transparent' }}
            />
            <Legend 
                verticalAlign="bottom" 
                wrapperStyle={{ paddingTop: '10px', fontWeight: '800', fontSize: '10px' }} 
                iconType="circle"
                iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
