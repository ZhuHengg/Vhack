import React from 'react'
import Panel from '../shared/Panel'

export default function TuningPanel({ params, updateParam }) {
  const SliderRow = ({ label, value, keyName, min, max, step }) => {
    // calculate fill percentage for custom track styling
    const pct = ((value - min) / (max - min)) * 100
    
    return (
      <div className="mb-5 last:mb-0">
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-[11px] text-text-secondary font-bold uppercase tracking-wider">{label}</span>
          <span className="font-mono text-[13px] font-bold text-cyan-400">{value.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => updateParam(keyName, parseFloat(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, var(--cyan-500) 0%, var(--cyan-500) ${pct}%, var(--bg-300) ${pct}%, var(--bg-300) 100%)`
          }}
        />
      </div>
    )
  }

  // Zone Visualizer calcs
  const lowerBound = Math.max(0, params.threshold - (params.bufferWidth / 2))
  const upperBound = Math.min(1, params.threshold + (params.bufferWidth / 2))
  
  const greenPct = lowerBound * 100
  const amberPct = (upperBound - lowerBound) * 100
  const redPct = (1 - upperBound) * 100

  return (
    <Panel className="border border-border">
      <div className="flex justify-between items-center mb-6">
        <h3 className="section-label">Parameter Tuning</h3>
      </div>

      <div className="space-y-1 mb-8">
        <SliderRow label="Fraud Threshold" value={params.threshold} keyName="threshold" min={0.10} max={0.90} step={0.01} />
        <SliderRow label="XGBoost Weight" value={params.xgbWeight} keyName="xgbWeight" min={0.00} max={1.00} step={0.05} />
        <SliderRow label="SMOTE Aggressiveness" value={params.smoteLevel} keyName="smoteLevel" min={0.00} max={1.00} step={0.05} />
        <SliderRow label="Flag Buffer Zone" value={params.bufferWidth} keyName="bufferWidth" min={0.02} max={0.30} step={0.02} />
      </div>

      {/* Zone Visualiser */}
      <div>
        <h4 className="section-label mb-2">Decision Boundaries</h4>
        <div className="flex h-3 rounded-full overflow-hidden w-full bg-bg-200 shadow-inner">
          <div className="h-full bg-[#10b981] transition-all duration-300" style={{ width: `${greenPct}%` }} />
          <div className="h-full bg-[#f59e0b] transition-all duration-300" style={{ width: `${amberPct}%` }} />
          <div className="h-full bg-[#ef4444] transition-all duration-300" style={{ width: `${redPct}%` }} />
        </div>
        <div className="flex justify-between mt-2 font-mono text-[10px] text-text-muted">
          <span>0.0</span>
          <span>{lowerBound.toFixed(2)}</span>
          <span>{upperBound.toFixed(2)}</span>
          <span>1.0</span>
        </div>
      </div>
    </Panel>
  )
}
