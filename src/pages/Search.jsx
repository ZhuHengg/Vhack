import React, { useState, useMemo } from 'react'
import Panel from '../components/shared/Panel'
import Badge from '../components/shared/Badge'
import { Search as SearchIcon, ShieldAlert } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatTime } from '../utils/formatters'
import clsx from 'clsx'

export default function Search({ engine }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  
  const { allTransactions } = engine

  // Group transactions by userId
  const users = useMemo(() => {
    const map = new Map()
    allTransactions.forEach(t => {
      if (!map.has(t.userId)) {
        map.set(t.userId, { 
          id: t.userId, 
          txns: [],
          totalAmt: 0,
          avgScore: 0,
          blockCount: 0,
          vpnCount: 0,
          velocityCount: 0
        })
      }
      const u = map.get(t.userId)
      u.txns.push(t)
      u.totalAmt += t.amount
      u.avgScore += t.ensembleScore
      if (t.decision === 'BLOCK') u.blockCount++
      if (t.vpnDetected) u.vpnCount++
      if (t.velocityFlag) u.velocityCount++
    })
    
    // Finalize averages
    return Array.from(map.values()).map(u => ({
      ...u,
      avgScore: u.avgScore / u.txns.length,
      threatLevel: (u.avgScore / u.txns.length) > 0.6 ? 'HIGH' : ((u.avgScore / u.txns.length) > 0.35 ? 'MEDIUM' : 'LOW'),
      radarData: [
        { subject: 'Velocity', A: Math.min(100, (u.velocityCount/u.txns.length)*100 * 3) },
        { subject: 'Avg Score', A: (u.avgScore / u.txns.length) * 100 },
        { subject: 'VPN Use', A: (u.vpnCount/u.txns.length) * 100 },
        { subject: 'Block Rate', A: (u.blockCount/u.txns.length) * 100 },
        { subject: 'Amt Risk', A: Math.min(100, (u.totalAmt/5000) * 100) },
        { subject: 'Max Score', A: Math.max(...u.txns.map(t=>t.ensembleScore)) * 100 },
      ]
    })).sort((a,b) => b.avgScore - a.avgScore)
  }, [allTransactions])

  const filteredUsers = searchTerm 
    ? users.filter(u => u.id.toLowerCase().includes(searchTerm.toLowerCase()))
    : users

  const getScoreColor = (score) => {
    if (score >= 0.7) return 'text-[#ef4444]'
    if (score >= 0.4) return 'text-[#f59e0b]'
    return 'text-[#10b981]'
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-112px)] max-w-[1400px] mx-auto">
      {/* LEFT COLUMN: User List */}
      <div className="w-[300px] flex flex-col gap-4">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" size={18} />
          <input 
            type="text" 
            placeholder="Search User ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-100 border border-border rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
          />
        </div>

        {/* List */}
        <Panel className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="p-3 border-b border-border bg-bg-50">
             <span className="section-label">Active Users: {filteredUsers.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto w-full custom-scrollbar p-2">
            {filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={clsx(
                  "w-full text-left p-3 rounded-xl mb-1 flex items-center justify-between transition-colors",
                  selectedUser?.id === u.id ? "bg-bg-300 shadow-glow-cyan" : "hover:bg-bg-200"
                )}
              >
                <div>
                  <div className="font-mono text-[14px] font-bold text-text-primary mb-1">
                    {u.id}
                  </div>
                  <div className="font-mono text-[11px] text-text-secondary">
                    {u.txns.length} txns · Total: {formatCurrency(u.totalAmt)}
                  </div>
                </div>
                <div className={clsx("font-mono font-bold text-[14px]", getScoreColor(u.avgScore))}>
                  {Math.round(u.avgScore * 100)}
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-6 text-center text-text-muted text-[13px] font-mono">
                No users found.
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* RIGHT COLUMN: Profile Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedUser ? (
          <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            {/* Header */}
            <Panel className="shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-signature flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    <span className="font-mono text-text-base text-bg-base text-[20px] font-bold">
                      {selectedUser.id.substring(4, 6)}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-mono font-bold text-[24px] text-text-primary leading-tight uppercase tracking-tight">
                      {selectedUser.id}
                    </h2>
                    <div className="mt-2">
                      <Badge decision={selectedUser.threatLevel} />
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                   <div className="section-label mb-1">Total Lifetime Volume</div>
                   <div className="font-mono font-bold text-[32px] text-text-primary">
                      {formatCurrency(selectedUser.totalAmt)}
                   </div>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-6 shrink-0">
              {/* Radar Chart */}
               <Panel title="Risk Vector Analysis" className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart data={selectedUser.radarData}>
                     <PolarGrid stroke="var(--border-md)" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'DM Sans' }} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                     <Radar name="Risk" dataKey="A" stroke="#06b6d4" fill="rgba(6,182,212,0.15)" fillOpacity={1} strokeWidth={2} />
                   </RadarChart>
                 </ResponsiveContainer>
               </Panel>
               
               {/* Stats Summary */}
                <Panel title="Profile Metrics" className="h-[300px]">
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <span className="font-mono text-text-secondary text-[12px] uppercase tracking-wide">Average Risk Score</span>
                      <span className={clsx("font-mono font-bold", getScoreColor(selectedUser.avgScore))}>
                        {Math.round(selectedUser.avgScore * 100)} / 100
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <span className="font-mono text-text-secondary text-[12px] uppercase tracking-wide">Block Rate</span>
                      <span className="font-mono font-bold text-text-primary text-[14px]">
                        {Math.round((selectedUser.blockCount / selectedUser.txns.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <span className="font-mono text-text-secondary text-[12px] uppercase tracking-wide">Known VPN Usage</span>
                      <span className="font-mono font-bold text-[#f59e0b] text-[14px]">
                        {selectedUser.vpnCount} txns
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3">
                      <span className="font-mono text-text-secondary text-[12px] uppercase tracking-wide">High Velocity Flags</span>
                      <span className="font-mono font-bold text-[#ef4444] text-[14px]">
                        {selectedUser.velocityCount} txns
                      </span>
                    </div>
                  </div>
                </Panel>
            </div>

            {/* History Table */}
            <Panel title="Transaction History" action={<span className="section-label">{selectedUser.txns.length} records</span>} className="flex-1 min-h-[300px]">
              <div className="grid grid-cols-12 gap-2 pb-2 mb-2 border-b border-border text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-text-muted">
                <div className="col-span-2">Time</div>
                <div className="col-span-2">ID</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1 text-right">Score</div>
                <div className="col-span-2 text-right pl-2">Decision</div>
                <div className="col-span-3 text-right">Signals</div>
              </div>
              <div className="space-y-1">
                {selectedUser.txns.slice().reverse().map(txn => (
                  <div key={txn.id} className="grid grid-cols-12 gap-2 items-center py-2.5 px-2 rounded-xl text-[12px] font-mono hover:bg-bg-200 transition-colors">
                    <div className="col-span-2 text-text-secondary">{formatTime(txn.timestamp)}</div>
                    <div className="col-span-2 text-text-primary font-bold">{txn.id.slice(4,10)}</div>
                    <div className="col-span-2 text-right text-text-primary font-bold">
                      {formatCurrency(txn.amount)}
                    </div>
                    <div className={clsx("col-span-1 text-right font-bold", getScoreColor(txn.ensembleScore))}>
                      {Math.round(txn.ensembleScore * 100)}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Badge decision={txn.decision} />
                    </div>
                    <div className="col-span-3 flex justify-end gap-1 flex-wrap pl-2">
                       {txn.vpnDetected && <span className="px-1.5 py-0.5 rounded bg-[rgba(6,182,212,0.1)] text-cyan-400 text-[9px] border border-[rgba(6,182,212,0.3)]">VPN</span>}
                       {txn.velocityFlag && <span className="px-1.5 py-0.5 rounded bg-[rgba(6,182,212,0.1)] text-cyan-400 text-[9px] border border-[rgba(6,182,212,0.3)]">VEL</span>}
                       {txn.newDevice && <span className="px-1.5 py-0.5 rounded bg-[rgba(6,182,212,0.1)] text-cyan-400 text-[9px] border border-[rgba(6,182,212,0.3)]">NEW DEV</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted bg-bg-100 border border-border rounded-2xl">
            <ShieldAlert size={48} className="mb-4 text-bg-300" />
            <p className="font-mono font-bold text-[18px] text-text-primary uppercase tracking-tight">No User Selected</p>
            <p className="font-mono text-[11px] text-text-secondary mt-1">Select a user from the left pane to view their profile.</p>
          </div>
        )}
      </div>
    </div>
  )
}
