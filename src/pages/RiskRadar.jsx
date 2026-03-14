/**
 * Risk Radar — VPN detection, transaction behaviour analysis, device fingerprinting
 * Radar visualization with risk indicators and behavioral analysis
 */

import React, { useMemo, useState } from 'react'
import {
  Radar as RadarIcon,
  Wifi,
  WifiOff,
  Smartphone,
  Globe,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  Activity,
  Eye,
  Fingerprint,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ZAxis,
} from 'recharts'

/* ─── City mapping (SE Asia focus) ──────────────────── */
const COUNTRY_CITIES = {
  MY: ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
  SG: ['Singapore'],
  TH: ['Bangkok', 'Chiang Mai', 'Phuket'],
  ID: ['Jakarta', 'Surabaya', 'Bali'],
  PH: ['Manila', 'Cebu', 'Davao'],
  VN: ['Ho Chi Minh', 'Hanoi', 'Da Nang'],
  MM: ['Yangon', 'Mandalay'],
  KH: ['Phnom Penh', 'Siem Reap'],
}

function pickCity(country) {
  const cities = COUNTRY_CITIES[country] || [country]
  return cities[Math.floor(Math.random() * cities.length)]
}

/* ─── Severity helpers ──────────────────────────────── */
const severityBg = {
  LOW: 'border-emerald-400/30 bg-emerald-400/5',
  MEDIUM: 'border-amber-400/30 bg-amber-400/5',
  HIGH: 'border-red-400/30 bg-red-400/5',
  CRITICAL: 'border-red-500/40 bg-red-500/10',
}
const severityText = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
  CRITICAL: 'text-red-500',
}
const severityBadge = {
  LOW: 'text-emerald-400 bg-emerald-400/10',
  MEDIUM: 'text-amber-400 bg-amber-400/10',
  HIGH: 'text-red-400 bg-red-400/10',
  CRITICAL: 'text-red-500 bg-red-500/15',
}

const tooltipStyle = {
  background: 'oklch(0.17 0.025 260)',
  border: '1px solid oklch(0.25 0.03 260)',
  borderRadius: '8px',
  fontSize: '11px',
  fontFamily: 'JetBrains Mono',
}

export default function RiskRadar({ engine }) {
  const { allTransactions: transactions } = engine
  const [selectedRisk, setSelectedRisk] = useState(null)

  /* ── VPN Analysis ─────────────────────────────────── */
  const vpnStats = useMemo(() => {
    const vpnTxns = transactions.filter(t => t.vpnDetected)
    const nonVpnTxns = transactions.filter(t => !t.vpnDetected)
    const vpnFraudRate = vpnTxns.length > 0
      ? vpnTxns.filter(t => t.isFraud).length / vpnTxns.length : 0
    const nonVpnFraudRate = nonVpnTxns.length > 0
      ? nonVpnTxns.filter(t => t.isFraud).length / nonVpnTxns.length : 0
    return {
      vpnCount: vpnTxns.length,
      nonVpnCount: nonVpnTxns.length,
      vpnFraudRate,
      nonVpnFraudRate,
      vpnBlockedRate: vpnTxns.length > 0 ? vpnTxns.filter(t => t.decision === 'BLOCK').length / vpnTxns.length : 0,
      vpnAvgRisk: vpnTxns.length > 0 ? vpnTxns.reduce((s, t) => s + t.ensembleScore, 0) / vpnTxns.length : 0,
    }
  }, [transactions])

  /* ── City distribution ────────────────────────────── */
  const cityData = useMemo(() => {
    const counts = {}
    transactions.forEach(t => {
      // deterministic city from country + userId
      const cities = COUNTRY_CITIES[t.country] || [t.country]
      const idx = t.userId ? t.userId.charCodeAt(t.userId.length - 1) % cities.length : 0
      const city = cities[idx]
      if (!counts[city]) counts[city] = { total: 0, fraud: 0, blocked: 0 }
      counts[city].total++
      if (t.isFraud) counts[city].fraud++
      if (t.decision === 'BLOCK') counts[city].blocked++
    })
    return Object.entries(counts).map(([city, data]) => ({
      city,
      ...data,
      fraudRate: data.total > 0 ? (data.fraud / data.total) * 100 : 0,
    })).sort((a, b) => b.total - a.total)
  }, [transactions])

  /* ── Device type distribution ─────────────────────── */
  const deviceData = useMemo(() => {
    const counts = {}
    transactions.forEach(t => {
      counts[t.deviceType] = (counts[t.deviceType] || 0) + 1
    })
    const colors = ['#00d4ff', '#a855f7', '#10b981', '#f59e0b', '#ef4444']
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }))
  }, [transactions])

  /* ── Risk scatter data (amount vs risk score) ─────── */
  const scatterData = useMemo(() => {
    return transactions.slice(0, 100).map(t => ({
      amount: t.amount,
      riskScore: t.ensembleScore * 100,
      status: t.decision,
      isVPN: t.vpnDetected,
    }))
  }, [transactions])

  /* ── Behavioral risk radar ────────────────────────── */
  const behaviorRadar = useMemo(() => {
    if (transactions.length === 0) return []
    const recent = transactions.slice(0, 50)

    const avgAmount = recent.reduce((s, t) => s + t.amount, 0) / recent.length
    const vpnRate = recent.filter(t => t.vpnDetected).length / recent.length
    const uniqueCountries = new Set(recent.map(t => t.country)).size
    const uniqueDevices = new Set(recent.map(t => t.deviceType)).size
    const highRiskRate = recent.filter(t => t.ensembleScore > 0.5).length / recent.length
    const avgVelocity = recent.length / 60

    return [
      { metric: 'Amount Risk', value: Math.min(100, (avgAmount / 100)) },
      { metric: 'VPN Usage', value: vpnRate * 100 },
      { metric: 'Geo Spread', value: Math.min(100, uniqueCountries * 20) },
      { metric: 'Device Diversity', value: Math.min(100, uniqueDevices * 25) },
      { metric: 'High Risk Rate', value: highRiskRate * 100 },
      { metric: 'Velocity', value: Math.min(100, avgVelocity * 50) },
    ]
  }, [transactions])

  /* ── Risk indicators ──────────────────────────────── */
  const riskIndicators = useMemo(() => {
    const recent = transactions.slice(0, 100)
    const uniqueCountries = new Set(transactions.map(t => t.country)).size
    return [
      {
        id: 'vpn', label: 'VPN Detection',
        description: 'Transactions from VPN/proxy connections',
        severity: vpnStats.vpnFraudRate > 0.3 ? 'CRITICAL' : vpnStats.vpnFraudRate > 0.15 ? 'HIGH' : 'MEDIUM',
        value: `${vpnStats.vpnCount} detected`,
        icon: WifiOff,
      },
      {
        id: 'velocity', label: 'Transaction Velocity',
        description: 'Rapid transaction patterns detected',
        severity: recent.length > 80 ? 'HIGH' : recent.length > 40 ? 'MEDIUM' : 'LOW',
        value: `${recent.length} in buffer`,
        icon: Zap,
      },
      {
        id: 'geo', label: 'Geographic Anomaly',
        description: 'Transactions from unusual locations',
        severity: uniqueCountries > 5 ? 'HIGH' : uniqueCountries > 3 ? 'MEDIUM' : 'LOW',
        value: `${uniqueCountries} countries`,
        icon: Globe,
      },
      {
        id: 'device', label: 'Device Fingerprint',
        description: 'Unknown or suspicious device patterns',
        severity: deviceData.length > 3 ? 'MEDIUM' : 'LOW',
        value: `${deviceData.length} device types`,
        icon: Fingerprint,
      },
      {
        id: 'amount', label: 'Amount Anomaly',
        description: 'Unusual transaction amounts detected',
        severity: recent.filter(t => t.amount > 5000).length > 5 ? 'HIGH' : 'MEDIUM',
        value: `${recent.filter(t => t.amount > 5000).length} high-value`,
        icon: AlertTriangle,
      },
      {
        id: 'time', label: 'Time Pattern',
        description: 'Off-hours transaction activity',
        severity: 'LOW',
        value: 'Normal range',
        icon: Clock,
      },
    ]
  }, [transactions, vpnStats, deviceData])

  /* ─── Render ──────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* ── Risk Indicators Grid ───────────────────────── */}
      <div className="grid grid-cols-6 gap-3">
        {riskIndicators.map(ind => {
          const Icon = ind.icon
          return (
            <div
              key={ind.id}
              onClick={() => setSelectedRisk(selectedRisk === ind.id ? null : ind.id)}
              className={clsx(
                'rounded-2xl border p-3 cursor-pointer transition-all bg-bg-100',
                severityBg[ind.severity],
                selectedRisk === ind.id && 'ring-1 ring-cyan-400/30'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={clsx('w-4 h-4', severityText[ind.severity])} />
                <span className={clsx('text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider', severityBadge[ind.severity])}>
                  {ind.severity}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground">{ind.label}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{ind.value}</p>
            </div>
          )
        })}
      </div>

      {/* ── Middle Row: Radar + Scatter ─────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Behavioral Risk Radar */}
        <div className="col-span-5 space-y-4">
          <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
            <div className="pb-2 pt-3 px-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <RadarIcon className="w-3.5 h-3.5 text-cyan-400" />
                Behavioral Risk Radar
              </h2>
            </div>
            <div className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={behaviorRadar}>
                  <PolarGrid stroke="oklch(0.25 0.03 260)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'oklch(0.60 0.02 260)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: 'oklch(0.40 0.02 260)' }} />
                  <Radar name="Risk" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* VPN / Proxy Analysis */}
          <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
            <div className="pb-2 pt-3 px-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                VPN / Proxy Analysis
              </h2>
            </div>
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VPN Transactions</p>
                  <p className="text-xl font-mono font-bold text-red-400">{vpnStats.vpnCount}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {transactions.length > 0 ? ((vpnStats.vpnCount / transactions.length) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VPN Fraud Rate</p>
                  <p className="text-xl font-mono font-bold text-amber-400">{(vpnStats.vpnFraudRate * 100).toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground">
                    vs {(vpnStats.nonVpnFraudRate * 100).toFixed(1)}% non-VPN
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VPN Blocked Rate</p>
                  <p className="text-lg font-mono font-bold text-cyan-400">{(vpnStats.vpnBlockedRate * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg VPN Risk</p>
                  <p className="text-lg font-mono font-bold text-cyan-400">{(vpnStats.vpnAvgRisk * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Scatter + City + Device */}
        <div className="col-span-7 space-y-4">
          {/* Risk Scatter Plot */}
          <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
            <div className="pb-2 pt-3 px-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Transaction Amount vs Risk Score
              </h2>
            </div>
            <div className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 260)" />
                  <XAxis dataKey="amount" name="Amount"
                    tick={{ fontSize: 10, fill: 'oklch(0.60 0.02 260)', fontFamily: 'JetBrains Mono' }}
                    label={{ value: 'Amount ($)', position: 'bottom', fontSize: 10, fill: 'oklch(0.50 0.02 260)' }} />
                  <YAxis dataKey="riskScore" name="Risk Score"
                    tick={{ fontSize: 10, fill: 'oklch(0.60 0.02 260)', fontFamily: 'JetBrains Mono' }}
                    label={{ value: 'Risk %', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'oklch(0.50 0.02 260)' }} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(value, name) => [
                      name === 'Amount' ? `$${Number(value).toFixed(2)}` : `${Number(value).toFixed(1)}%`,
                      name
                    ]} />
                  <Scatter data={scatterData.filter(d => d.status === 'APPROVE')} fill="#10b981" fillOpacity={0.6} />
                  <Scatter data={scatterData.filter(d => d.status === 'FLAG')} fill="#f59e0b" fillOpacity={0.7} />
                  <Scatter data={scatterData.filter(d => d.status === 'BLOCK')} fill="#ef4444" fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" /> Approved
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-amber-400" /> Flagged
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-red-400" /> Blocked
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* City Distribution */}
            <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
              <div className="pb-2 pt-3 px-4">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  By City
                </h2>
              </div>
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {cityData.slice(0, 6).map(c => (
                    <div key={c.city} className="flex items-center gap-2">
                      <span className="text-xs text-foreground w-28 shrink-0 truncate">{c.city}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-400/60"
                          style={{ width: `${(c.total / Math.max(...cityData.map(d => d.total))) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{c.total}</span>
                      <span className={clsx(
                        'text-[10px] font-mono w-12 text-right',
                        c.fraudRate > 10 ? 'text-red-400' : c.fraudRate > 5 ? 'text-amber-400' : 'text-emerald-400'
                      )}>
                        {c.fraudRate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Device Distribution */}
            <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
              <div className="pb-2 pt-3 px-4">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  By Device
                </h2>
              </div>
              <div className="px-2 pb-3">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-1">
                  {deviceData.map(d => (
                    <span key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
