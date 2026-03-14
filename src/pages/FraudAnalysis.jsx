import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Shield,
  Eye,
  Target,
  Layers,
  Network,
  Clock,
  DollarSign,
  Users,
  Activity,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line, CartesianGrid, Legend,
  Treemap,
} from 'recharts';

const FRAUD_PATTERNS = [
  {
    id: 'p1',
    name: 'Velocity Attack',
    description: 'Rapid succession of small transactions to test stolen card details before making large purchases',
    severity: 'HIGH',
    frequency: 39,
    affectedUsers: 14,
    detectionRate: 0.95,
    avgAmount: 12.50,
    pattern: 'Multiple transactions < $15 within 60s from same IP but different cards',
    indicators: ['High Velocity', 'Micro-transactions', 'IP matching']
  },
  {
    id: 'p2',
    name: 'Account Takeover',
    description: 'Unauthorized access to user accounts through credential stuffing or phishing',
    severity: 'CRITICAL',
    frequency: 5,
    affectedUsers: 3,
    detectionRate: 0.87,
    avgAmount: 1540.00,
    pattern: 'Login from new device/country followed immediately by max-limit transfer',
    indicators: ['New Device', 'Location Anomaly', 'Max Limit']
  },
  {
    id: 'p3',
    name: 'Synthetic Identity',
    description: 'Fraudsters create fake identities combining real and fabricated information',
    severity: 'HIGH',
    frequency: 12,
    affectedUsers: 5,
    detectionRate: 0.72,
    avgAmount: 850.00,
    pattern: 'New account creation with mismatched credit bureau data and rapid credit utilization',
    indicators: ['Data Mismatch', 'New Account', 'Rapid Utilization']
  },
  {
    id: 'p4',
    name: 'Merchant Collusion',
    description: 'Fraudulent merchants processing fake transactions to extract funds',
    severity: 'MEDIUM',
    frequency: 18,
    affectedUsers: 6,
    detectionRate: 0.81,
    avgAmount: 450.00,
    pattern: 'High volume of round-dollar transactions at anomalous times for merchant category',
    indicators: ['Round Amounts', 'Time Anomaly', 'High Volume']
  },
  {
    id: 'p5',
    name: 'Cross-Border Laundering',
    description: 'Moving illicit funds across international borders using complex transactional webs to obscure their origin.',
    severity: 'CRITICAL',
    frequency: 8,
    affectedUsers: 2,
    detectionRate: 0.65,
    avgAmount: 12500.00,
    pattern: 'Series of transfers bouncing across 3+ countries ending in high-risk jurisdictions.',
    indicators: ['Multiple Countries', 'High Value', 'Rapid Movement']
  },
  {
    id: 'p6',
    name: 'Promo Abuse',
    description: 'Exploiting marketing promotions, bonuses, or referral systems by creating fake accounts or automating workflows.',
    severity: 'LOW',
    frequency: 142,
    affectedUsers: 85,
    detectionRate: 0.92,
    avgAmount: 15.00,
    pattern: 'Batch creation of accounts from same subnet claiming sign-up bonus and withdrawing.',
    indicators: ['Same Subnet', 'Bonus Claim', 'Immediate Withdrawal']
  },
  {
    id: 'p7',
    name: 'SIM Swap P2P',
    description: 'Intercepting SMS OTPs via SIM swapping to authorize unauthorized peer-to-peer transfers.',
    severity: 'CRITICAL',
    frequency: 3,
    affectedUsers: 3,
    detectionRate: 0.78,
    avgAmount: 4200.00,
    pattern: 'Carrier change event followed by password reset request and immediate P2P transfer.',
    indicators: ['Carrier Change', 'Password Reset', 'OTP Override']
  },
  {
    id: 'p8',
    name: 'Mule Network',
    description: 'Coordinated network of accounts (mules) used to receive and quickly disperse fraudulent funds.',
    severity: 'HIGH',
    frequency: 14,
    affectedUsers: 45,
    detectionRate: 0.84,
    avgAmount: 3100.00,
    pattern: 'One account sending funds to 5+ distinct accounts which immediately withdraw to crypto.',
    indicators: ['Fan-out Transfer', 'Crypto Exit', 'Dormant Account Wake']
  }
];

function PatternCard({ pattern, isSelected, onSelect }) {
  const severityColors = {
    LOW: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/30' },
    MEDIUM: { bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/30' },
    HIGH: { bg: 'bg-red-400/10', text: 'text-red-400', border: 'border-red-400/30' },
    CRITICAL: { bg: 'bg-red-500/15', text: 'text-red-500', border: 'border-red-500/40' },
  };

  const colors = severityColors[pattern.severity];

  return (
    <div
      onClick={onSelect}
      className={clsx(
        'p-4 border rounded-lg cursor-pointer transition-all',
        isSelected ? 'border-cyan-400/40 bg-cyan-400/5' : `${colors.border} hover:bg-white/[0.02]`
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{pattern.name}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{pattern.description}</p>
        </div>
        <span className={clsx('text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider', colors.bg, colors.text)}>
          {pattern.severity}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">Frequency</p>
          <p className="text-sm font-mono font-bold text-foreground">{pattern.frequency}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">Affected</p>
          <p className="text-sm font-mono font-bold text-foreground">{pattern.affectedUsers}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">Detection</p>
          <p className="text-sm font-mono font-bold text-emerald-400">{(pattern.detectionRate * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}

function PatternDetail({ pattern }) {
  return (
    <div className="space-y-4">
      <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{pattern.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">{pattern.description}</p>
            </div>
            <span className={clsx(
              'text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider',
              pattern.severity === 'LOW' ? 'text-emerald-400 bg-emerald-400/10' :
              pattern.severity === 'MEDIUM' ? 'text-amber-400 bg-amber-400/10' :
              pattern.severity === 'HIGH' ? 'text-red-400 bg-red-400/10' :
              'text-red-500 bg-red-500/15'
            )}>
              {pattern.severity}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-white/[0.02] rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3" /> Frequency
              </p>
              <p className="text-xl font-mono font-bold text-cyan-400 mt-1">{pattern.frequency}</p>
              <p className="text-[10px] text-muted-foreground">incidents/month</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" /> Affected Users
              </p>
              <p className="text-xl font-mono font-bold text-amber-400 mt-1">{pattern.affectedUsers}</p>
              <p className="text-[10px] text-muted-foreground">unique accounts</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3" /> Detection Rate
              </p>
              <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{(pattern.detectionRate * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">caught by model</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Avg Amount
              </p>
              <p className="text-xl font-mono font-bold text-foreground mt-1">${pattern.avgAmount.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">per incident</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Description */}
      <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
        <div className="pb-2 pt-3 px-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Attack Pattern
          </h2>
        </div>
        <div className="px-4 pb-4">
          <div className="bg-white/[0.02] rounded-lg p-3 border border-border/30">
            <p className="text-xs text-foreground font-mono leading-relaxed">{pattern.pattern}</p>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
        <div className="pb-2 pt-3 px-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Key Indicators
          </h2>
        </div>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {pattern.indicators.map((indicator, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-border/30">
                <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="text-xs text-foreground">{indicator}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FraudAnalysis({ engine }) {
  const transactions = engine?.transactions || [];
  const [selectedPattern, setSelectedPattern] = useState(null);

  // Fraud by category
  const categoryData = useMemo(() => {
    const counts = {};
    transactions.forEach(t => {
      if (!counts[t.merchantCategory]) counts[t.merchantCategory] = { total: 0, fraud: 0 };
      counts[t.merchantCategory].total++;
      if (t.isActualFraud) counts[t.merchantCategory].fraud++;
    });
    return Object.entries(counts)
      .map(([category, data]) => ({
        category,
        total: data.total,
        fraud: data.fraud,
        fraudRate: data.total > 0 ? (data.fraud / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.fraud - a.fraud)
      .slice(0, 8);
  }, [transactions]);

  // Detection rate by pattern
  const detectionData = useMemo(() => {
    return FRAUD_PATTERNS.map(p => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
      detection: Math.round(p.detectionRate * 100),
      frequency: p.frequency,
    }));
  }, []);

  // Transaction type breakdown
  const txnTypeData = useMemo(() => {
    const counts = {};
    transactions.forEach(t => {
      if (!counts[t.transactionType]) counts[t.transactionType] = { total: 0, fraud: 0 };
      counts[t.transactionType].total++;
      if (t.isActualFraud) counts[t.transactionType].fraud++;
    });
    return Object.entries(counts).map(([type, data]) => ({
      type,
      total: data.total,
      fraud: data.fraud,
      safe: data.total - data.fraud,
    }));
  }, [transactions]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
          <div className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Known Patterns</p>
            <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">{FRAUD_PATTERNS.length}</p>
            <p className="text-xs text-muted-foreground">active threat patterns</p>
          </div>
        </div>
        <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
          <div className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Critical Threats</p>
            <p className="text-2xl font-mono font-bold text-red-400 mt-1">
              {FRAUD_PATTERNS.filter(p => p.severity === 'CRITICAL').length}
            </p>
            <p className="text-xs text-muted-foreground">require immediate attention</p>
          </div>
        </div>
        <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
          <div className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Detection Rate</p>
            <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
              {(FRAUD_PATTERNS.reduce((s, p) => s + p.detectionRate, 0) / FRAUD_PATTERNS.length * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">across all patterns</p>
          </div>
        </div>
        <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
          <div className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Affected</p>
            <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
              {FRAUD_PATTERNS.reduce((s, p) => s + p.affectedUsers, 0)}
            </p>
            <p className="text-xs text-muted-foreground">unique users impacted</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Pattern List */}
        <div className="col-span-4 space-y-3">
          <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
            <div className="pb-2 pt-3 px-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fraud Patterns
              </h2>
            </div>
            <div className="px-3 pb-3">
              <div className="h-[600px] overflow-y-auto custom-scrollbar">
                <div className="space-y-2 pr-2">
                  {FRAUD_PATTERNS.map(pattern => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      isSelected={selectedPattern?.id === pattern.id}
                      onSelect={() => setSelectedPattern(pattern)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detail + Charts */}
        <div className="col-span-8 space-y-4">
          {selectedPattern ? (
            <PatternDetail pattern={selectedPattern} />
          ) : (
            <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
              <div className="p-8 text-center text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a fraud pattern to view details</p>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Fraud by Category */}
            <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
              <div className="pb-2 pt-3 px-4">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fraud by Merchant Category
                </h2>
              </div>
              <div className="px-2 pb-3">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 260)" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: 'oklch(0.60 0.02 260)', fontFamily: 'JetBrains Mono' }} />
                    <YAxis
                      dataKey="category"
                      type="category"
                      width={90}
                      tick={{ fontSize: 9, fill: 'oklch(0.60 0.02 260)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'oklch(0.17 0.025 260)',
                        border: '1px solid oklch(0.25 0.03 260)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                    <Bar dataKey="fraud" fill="#ef4444" fillOpacity={0.7} radius={[0, 3, 3, 0]} name="Fraud" />
                    <Bar dataKey="total" fill="#00d4ff" fillOpacity={0.3} radius={[0, 3, 3, 0]} name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detection Rate by Pattern */}
            <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
              <div className="pb-2 pt-3 px-4">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Detection Rate by Pattern
                </h2>
              </div>
              <div className="px-2 pb-3">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={detectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 260)" />
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'oklch(0.60 0.02 260)' }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 9, fill: 'oklch(0.60 0.02 260)', fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: 'oklch(0.17 0.025 260)',
                        border: '1px solid oklch(0.25 0.03 260)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                    <Bar dataKey="detection" fill="#10b981" fillOpacity={0.7} radius={[3, 3, 0, 0]} name="Detection %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Transaction Type Breakdown */}
          <div className="bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300 border border-white/5">
            <div className="pb-2 pt-3 px-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Transaction Type Breakdown
              </h2>
            </div>
            <div className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={txnTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 260)" />
                  <XAxis dataKey="type" tick={{ fontSize: 9, fill: 'oklch(0.60 0.02 260)' }} />
                  <YAxis tick={{ fontSize: 9, fill: 'oklch(0.60 0.02 260)', fontFamily: 'JetBrains Mono' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(0.17 0.025 260)',
                      border: '1px solid oklch(0.25 0.03 260)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="safe" stackId="a" fill="#10b981" fillOpacity={0.6} name="Safe" />
                  <Bar dataKey="fraud" stackId="a" fill="#ef4444" fillOpacity={0.7} name="Fraud" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
