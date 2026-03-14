import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell
} from 'recharts'

export function FraudRateSparkline({ data }) {
  // data is [{t: 0, rate: 0.1}, ...]
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="t" 
            tickFormatter={(val) => `-${val}s`} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
            reversed
          />
          <YAxis 
            tickFormatter={(val) => `${(val*100).toFixed(0)}%`} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-100)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            itemStyle={{ color: '#ef4444', fontFamily: 'JetBrains Mono', fontSize: '13px', fontWeight: 'bold' }}
            formatter={(value) => [`${(value*100).toFixed(1)}%`, 'Fraud Rate']}
            labelFormatter={(label) => `-${label} seconds ago`}
            labelStyle={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans', fontSize: '12px', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="rate" 
            stroke="#ef4444" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRate)" 
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScoreHistogram({ data, threshold, bufferWidth }) {
  // data: [{bin: 0.05, count: 12}]
  const lowerBound = threshold - (bufferWidth / 2)
  const upperBound = threshold + (bufferWidth / 2)

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="bin" 
            tickFormatter={(val) => val.toFixed(2)} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            contentStyle={{ backgroundColor: 'var(--bg-100)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            itemStyle={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontSize: '13px', fontWeight: 'bold' }}
            labelStyle={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans', fontSize: '12px', marginBottom: '4px' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={300}>
            {data.map((entry, index) => {
              let fill = '#10b981' // green
              if (entry.bin >= upperBound) fill = '#ef4444' // red
              else if (entry.bin >= lowerBound) fill = '#f59e0b' // amber
              return <Cell key={`cell-${index}`} fill={fill} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
