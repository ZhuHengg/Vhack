import React from 'react'
import KpiCard from '../components/shared/KpiCard'
import Panel from '../components/shared/Panel'
import TransactionFeed from '../components/dashboard/TransactionFeed'
import TuningPanel from '../components/dashboard/TuningPanel'
import ConfusionMatrix from '../components/dashboard/ConfusionMatrix'
import { FraudRateSparkline, ScoreHistogram } from '../components/dashboard/Charts'
import { formatScore } from '../utils/formatters'

export default function Dashboard({ engine }) {
  const { 
    params, transactions, matrix, trends, 
    sparkline, histogram, total, blocked, flagged, 
    updateParam 
  } = engine

  // Derived Trend Directions
  const blockedTrend = trends.blockedRate > trends.fraudRatePrev ? 'up' : 'down'
  const precisionScore = matrix.precision

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-6">
        <KpiCard 
          label="Total Transactions" 
          value={total.toLocaleString()} 
          subText="Last 500 buffer window"
          accentColor="blue"
        />
        <KpiCard 
          label="Blocked %" 
          value={formatScore(total ? blocked/total : 0)} 
          subText={`${blocked} txns blocked`}
          trend={blockedTrend}
          trendGood={false} // up is bad
          accentColor="red"
        />
        <KpiCard 
          label="Flagged %" 
          value={formatScore(total ? flagged/total : 0)} 
          subText={`${flagged} txns flagged`}
          trend={trends.flaggedRate > 0.05 ? 'up' : 'down'}
          trendGood={false}
          accentColor="amber"
        />
        <KpiCard 
          label="Precision" 
          value={formatScore(precisionScore)} 
          subText="Positive Predictive Value"
          accentColor="green"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* LEFT COLUMN: Charts & Feed */}
        <div className="col-span-2 space-y-6 flex flex-col h-full">
          <div className="grid grid-cols-2 gap-6">
            <Panel title="Fraud rate — last 60s">
              <FraudRateSparkline data={sparkline} />
            </Panel>
            <Panel title="Risk score distribution">
              <ScoreHistogram data={histogram} threshold={params.threshold} bufferWidth={params.bufferWidth} />
            </Panel>
          </div>
          
          <TransactionFeed transactions={transactions} totalTotalBufferCount={total} />
        </div>

        {/* RIGHT COLUMN: Tuning & Matrix */}
        <div className="col-span-1 space-y-6 flex flex-col h-full">
          <TuningPanel params={params} updateParam={updateParam} />
          
          <ConfusionMatrix matrix={matrix} />

          {/* Model Weights (Ensemble bars) */}
          <Panel title="Ensemble Weights">
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[11px] font-bold text-cyan-400 uppercase tracking-wide">XGBoost</span>
                  <span className="font-mono text-[12px] font-bold">{(params.xgbWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-bg-200">
                  <div className="h-full bg-cyan-500 shadow-glow-cyan transition-all duration-300" style={{ width: `${params.xgbWeight * 100}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[11px] font-bold text-teal-400 uppercase tracking-wide">LightGBM</span>
                  <span className="font-mono text-[12px] font-bold">{((1 - params.xgbWeight) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-bg-200">
                  <div className="h-full bg-teal-500 shadow-glow-teal transition-all duration-300" style={{ width: `${(1 - params.xgbWeight) * 100}%` }} />
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

    </div>
  )
}
