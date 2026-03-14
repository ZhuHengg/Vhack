/**
 * Fraud Simulator — Scenario testing and threshold experimentation
 * Allows judges to create custom fraud scenarios and see how the model responds
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  FlaskConical,
  Play,
  RotateCcw,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Beaker,
} from 'lucide-react'
import clsx from 'clsx'
import { generateTransaction } from '../utils/fraudScoring'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell, Legend, AreaChart, Area,
} from 'recharts'

/* ── tiny slider ────────────────────────────────────── */
function ParamSlider({ label, value, onChange, min, max, step, format }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</label>
        <span className="text-xs font-mono text-cyan-400">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-400"
      />
    </div>
  )
}

export default function FraudSimulator({ engine }) {
  const { params, updateParam } = engine

  const [scenarioSize, setScenarioSize] = useState(200)
  const [fraudRate, setFraudRate] = useState(0.05)
  const [scenarioResults, setScenarioResults] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [simulatedTxns, setSimulatedTxns] = useState([])
  const [comparisonMode, setComparisonMode] = useState(false)
  const [comparisonParams, setComparisonParams] = useState({
    threshold: 0.30,
    xgbWeight: params.xgbWeight
  })
  const [comparisonResults, setComparisonResults] = useState(null)

  // Run threshold sweep
  const runThresholdSweep = useCallback(() => {
    setIsRunning(true)

    // Generate a batch of transactions
    const txns = []
    for (let i = 0; i < scenarioSize; i++) {
      const forceHigh = Math.random() < fraudRate
      const txn = generateTransaction(forceHigh, params.smoteLevel)
      // Compute ensemble score
      const ensembleScore = (txn.xgbScore * params.xgbWeight) + (txn.lgbScore * (1 - params.xgbWeight))
      // Ground truth
      const isActualFraud = ensembleScore > (params.threshold + (Math.random() * 0.2 - 0.1))
      txns.push({ ...txn, ensembleScore, riskScore: ensembleScore, isActualFraud })
    }
    setSimulatedTxns(txns)

    // Sweep thresholds
    const results = []
    for (let threshold = 0.1; threshold <= 0.9; threshold += 0.05) {
      let tp = 0, fp = 0, fn = 0, tn = 0

      txns.forEach(txn => {
        const predicted = txn.riskScore >= threshold
        const actual = txn.isActualFraud
        if (predicted && actual) tp++
        else if (predicted && !actual) fp++
        else if (!predicted && actual) fn++
        else tn++
      })

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0
      const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0
      const blockedRate = (tp + fp) / txns.length
      const falsePositiveRate = fp + tn > 0 ? fp / (fp + tn) : 0

      results.push({
        threshold: Math.round(threshold * 100) / 100,
        precision: Math.round(precision * 1000) / 10,
        recall: Math.round(recall * 1000) / 10,
        f1: Math.round(f1 * 1000) / 10,
        blockedRate: Math.round(blockedRate * 1000) / 10,
        falsePositiveRate: Math.round(falsePositiveRate * 1000) / 10,
      })
    }

    setScenarioResults(results)
    setIsRunning(false)
  }, [scenarioSize, fraudRate, params])

  // Run comparison simulation
  const runComparison = useCallback(() => {
    const txns = []
    for (let i = 0; i < scenarioSize; i++) {
      const forceHigh = Math.random() < fraudRate
      const txn = generateTransaction(forceHigh, params.smoteLevel)
      const ensembleScore = (txn.xgbScore * params.xgbWeight) + (txn.lgbScore * (1 - params.xgbWeight))
      const isActualFraud = ensembleScore > (params.threshold + (Math.random() * 0.2 - 0.1))
      txns.push({ ...txn, ensembleScore, riskScore: ensembleScore, isActualFraud })
    }
    setSimulatedTxns(txns)

    const calcMetrics = (threshold) => {
      let tp = 0, fp = 0, fn = 0, tn = 0
      txns.forEach(txn => {
        const predicted = txn.riskScore >= threshold
        const actual = txn.isActualFraud
        if (predicted && actual) tp++
        else if (predicted && !actual) fp++
        else if (!predicted && actual) fn++
        else tn++
      })
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0
      const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0
      return { tp, fp, fn, tn, precision, recall, f1 }
    }

    return {
      current: calcMetrics(params.threshold),
      comparison: calcMetrics(comparisonParams.threshold),
    }
  }, [scenarioSize, fraudRate, params, comparisonParams])

  // Score distribution of simulated transactions
  const scoreDistribution = useMemo(() => {
    const buckets = Array.from({ length: 20 }, (_, i) => ({
      range: `${(i * 5).toString().padStart(2, '0')}-${((i + 1) * 5).toString().padStart(2, '0')}`,
      count: 0,
      fraudCount: 0,
    }))

    simulatedTxns.forEach(txn => {
      const idx = Math.min(19, Math.floor(txn.riskScore * 20))
      buckets[idx].count++
      if (txn.isActualFraud) buckets[idx].fraudCount++
    })

    return buckets
  }, [simulatedTxns])

  // Find optimal threshold
  const optimalThreshold = useMemo(() => {
    if (scenarioResults.length === 0) return null
    return scenarioResults.reduce((best, r) => r.f1 > best.f1 ? r : best, scenarioResults[0])
  }, [scenarioResults])

  /* ── shared recharts tooltip style ────── */
  const tooltipStyle = {
    background: 'oklch(0.17 0.025 260)',
    border: '1px solid oklch(0.25 0.03 260)',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono',
  }
  const axisTick = { fontSize: 10, fill: 'oklch(0.60 0.02 260)', fontFamily: 'JetBrains Mono' }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            Fraud Scenario Simulator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test different scenarios and find optimal thresholds for your fraud detection model
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all',
              comparisonMode
                ? 'border-cyan-400/30 text-cyan-400 bg-cyan-400/5'
                : 'border-white/10 text-muted-foreground hover:bg-white/5'
            )}
          >
            <Beaker className="w-3.5 h-3.5" />
            {comparisonMode ? 'COMPARISON ON' : 'COMPARE PARAMS'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* ── Left: Scenario Controls ─────────────────────── */}
        <div className="col-span-4 space-y-4">
          <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
            <div className="pb-2 pt-3 px-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Scenario Configuration
              </h2>
            </div>
            <div className="px-4 pb-4 space-y-4">
              <ParamSlider label="Sample Size" value={scenarioSize} onChange={setScenarioSize}
                min={50} max={1000} step={50} format={v => `${v} txns`} />
              <ParamSlider label="Fraud Rate" value={fraudRate} onChange={setFraudRate}
                min={0.01} max={0.30} step={0.01} format={v => `${(v * 100).toFixed(0)}%`} />
              <ParamSlider label="Current Threshold" value={params.threshold}
                onChange={v => updateParam('threshold', v)}
                min={0.10} max={0.90} step={0.01} format={v => v.toFixed(2)} />
              <ParamSlider label="XGBoost Weight" value={params.xgbWeight}
                onChange={v => updateParam('xgbWeight', v)}
                min={0} max={1} step={0.05} format={v => `${(v * 100).toFixed(0)}%`} />
              <ParamSlider label="SMOTE" value={params.smoteLevel}
                onChange={v => updateParam('smoteLevel', v)}
                min={0.10} max={1} step={0.05} format={v => v.toFixed(2)} />

              <button
                onClick={runThresholdSweep}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-cyan-400/30 text-cyan-400 font-mono text-xs bg-cyan-400/10 hover:bg-cyan-400/20 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isRunning ? 'RUNNING...' : 'RUN THRESHOLD SWEEP'}
              </button>

              {comparisonMode && (
                <button
                  onClick={() => setComparisonResults(runComparison())}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-purple-400/30 text-purple-400 font-mono text-xs bg-purple-400/10 hover:bg-purple-400/20 transition-all"
                >
                  <Beaker className="w-4 h-4" />
                  RUN A/B COMPARISON
                </button>
              )}
            </div>
          </div>

          {/* Comparison Parameters */}
          {comparisonMode && (
            <div className="bg-bg-100 rounded-2xl border border-purple-400/30 overflow-hidden">
              <div className="pb-2 pt-3 px-4">
                <h2 className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                  Comparison Parameters (B)
                </h2>
              </div>
              <div className="px-4 pb-4 space-y-3">
                <ParamSlider label="Threshold B" value={comparisonParams.threshold}
                  onChange={v => setComparisonParams(prev => ({ ...prev, threshold: v }))}
                  min={0.10} max={0.90} step={0.01} format={v => v.toFixed(2)} />
                <ParamSlider label="XGBoost B" value={comparisonParams.xgbWeight}
                  onChange={v => setComparisonParams(prev => ({ ...prev, xgbWeight: v }))}
                  min={0} max={1} step={0.05} format={v => `${(v * 100).toFixed(0)}%`} />
              </div>
            </div>
          )}

          {/* Optimal Threshold */}
          {optimalThreshold && (
            <div className="bg-bg-100 rounded-2xl border border-emerald-400/30 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Optimal Threshold Found</span>
                </div>
                <p className="text-3xl font-mono font-bold text-emerald-400">{optimalThreshold.threshold.toFixed(2)}</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Precision</p>
                    <p className="text-sm font-mono font-bold text-foreground">{optimalThreshold.precision}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Recall</p>
                    <p className="text-sm font-mono font-bold text-foreground">{optimalThreshold.recall}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">F1</p>
                    <p className="text-sm font-mono font-bold text-purple-400">{optimalThreshold.f1}%</p>
                  </div>
                </div>
                <button
                  onClick={() => updateParam('threshold', optimalThreshold.threshold)}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-1.5 rounded-lg border border-emerald-400/30 text-emerald-400 font-mono text-xs bg-emerald-400/10 hover:bg-emerald-400/20 transition-all"
                >
                  APPLY OPTIMAL THRESHOLD
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Results ─────────────────────────────── */}
        <div className="col-span-8 space-y-4">
          {scenarioResults.length > 0 ? (
            <>
              {/* Precision-Recall Tradeoff */}
              <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
                <div className="pb-2 pt-3 px-4">
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Precision-Recall Tradeoff Curve
                  </h2>
                </div>
                <div className="px-4 pb-3">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={scenarioResults}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 260)" />
                      <XAxis dataKey="threshold" tick={axisTick}
                        label={{ value: 'Threshold', position: 'bottom', fontSize: 10, fill: 'oklch(0.50 0.02 260)' }} />
                      <YAxis tick={axisTick} domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="precision" stroke="#00d4ff" strokeWidth={2} dot={false} name="Precision %" />
                      <Line type="monotone" dataKey="recall" stroke="#f59e0b" strokeWidth={2} dot={false} name="Recall %" />
                      <Line type="monotone" dataKey="f1" stroke="#a855f7" strokeWidth={2.5} dot={false} name="F1 %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* False Positive Rate + Blocked Rate */}
              <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
                <div className="pb-2 pt-3 px-4">
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Blocked Rate & False Positive Rate vs Threshold
                  </h2>
                </div>
                <div className="px-4 pb-3">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={scenarioResults}>
                      <defs>
                        <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 260)" />
                      <XAxis dataKey="threshold" tick={axisTick} />
                      <YAxis tick={axisTick} domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area type="monotone" dataKey="blockedRate" stroke="#ef4444" fill="url(#blockedGrad)" strokeWidth={2} name="Blocked %" />
                      <Area type="monotone" dataKey="falsePositiveRate" stroke="#f59e0b" fill="url(#fpGrad)" strokeWidth={2} name="False Positive %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Score Distribution */}
              <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
                <div className="pb-2 pt-3 px-4">
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Simulated Score Distribution ({simulatedTxns.length} transactions)
                  </h2>
                </div>
                <div className="px-4 pb-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 260)" />
                      <XAxis dataKey="range" tick={{ fontSize: 8, fill: 'oklch(0.60 0.02 260)', fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={axisTick} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="count" fill="#00d4ff" fillOpacity={0.5} name="All" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="fraudCount" fill="#ef4444" fillOpacity={0.7} name="Fraud" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-bg-100 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-12 text-center text-muted-foreground">
                <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">No simulation results yet</p>
                <p className="text-xs mt-1">Configure your scenario parameters and click "Run Threshold Sweep" to begin</p>
                <p className="text-xs mt-3 text-cyan-400/60">
                  The simulator will generate {scenarioSize} transactions with {(fraudRate * 100).toFixed(0)}% fraud rate
                  and sweep thresholds from 0.10 to 0.90
                </p>
              </div>
            </div>
          )}

          {/* A/B Comparison Results */}
          {comparisonMode && comparisonResults && (
            <div className="bg-bg-100 rounded-2xl border border-purple-400/30 overflow-hidden">
              <div className="pb-2 pt-3 px-4">
                <h2 className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                  A/B Parameter Comparison
                </h2>
              </div>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Config A */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Config A (Current)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Precision', value: (comparisonResults.current.precision * 100).toFixed(1) },
                        { label: 'Recall', value: (comparisonResults.current.recall * 100).toFixed(1) },
                        { label: 'F1 Score', value: (comparisonResults.current.f1 * 100).toFixed(1) },
                        { label: 'False Pos', value: comparisonResults.current.fp.toString() },
                      ].map(m => (
                        <div key={m.label} className="bg-cyan-400/5 rounded p-2">
                          <p className="text-[9px] text-muted-foreground uppercase">{m.label}</p>
                          <p className="text-sm font-mono font-bold text-cyan-400">{m.value}{m.label !== 'False Pos' ? '%' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Config B */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Config B (Comparison)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Precision', value: (comparisonResults.comparison.precision * 100).toFixed(1) },
                        { label: 'Recall', value: (comparisonResults.comparison.recall * 100).toFixed(1) },
                        { label: 'F1 Score', value: (comparisonResults.comparison.f1 * 100).toFixed(1) },
                        { label: 'False Pos', value: comparisonResults.comparison.fp.toString() },
                      ].map(m => (
                        <div key={m.label} className="bg-purple-400/5 rounded p-2">
                          <p className="text-[9px] text-muted-foreground uppercase">{m.label}</p>
                          <p className="text-sm font-mono font-bold text-purple-400">{m.value}{m.label !== 'False Pos' ? '%' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
