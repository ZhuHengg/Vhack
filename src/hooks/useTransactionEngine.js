import { useState, useEffect, useCallback, useMemo } from 'react'
import { generateTransaction } from '../utils/fraudScoring'

export function useTransactionEngine() {
  const [params, setParams] = useState({
    threshold: 0.50,
    xgbWeight: 0.60,
    smoteLevel: 0.30,
    bufferWidth: 0.10,
    simulationSpeed: 1 // 1 txn/s
  })

  const [allTransactions, setAllTransactions] = useState([])
  const [isRunning, setIsRunning] = useState(true)
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [attackQueue, setAttackQueue] = useState(0)

  const processTransaction = useCallback((txnObj) => {
    const ensembleScore = (txnObj.xgbScore * params.xgbWeight) + (txnObj.lgbScore * (1 - params.xgbWeight))
    const lowerBound = params.threshold - (params.bufferWidth / 2)
    const upperBound = params.threshold + (params.bufferWidth / 2)
    
    let decision = 'APPROVE'
    if (ensembleScore >= upperBound) decision = 'BLOCK'
    else if (ensembleScore >= lowerBound) decision = 'FLAG'
    
    // ground truth (simulated)
    const isFraud = ensembleScore > (params.threshold + (Math.random()*0.2 - 0.1))

    return { ...txnObj, ensembleScore, decision, isFraud }
  }, [params])

  // Generator Effect
  useEffect(() => {
    if (!isRunning && attackQueue === 0) return

    let timeoutId
    const tick = () => {
      const isAttack = attackQueue > 0
      const rawTxn = generateTransaction(isAttack, params.smoteLevel)
      
      setAllTransactions(prev => {
        const processed = processTransaction(rawTxn)
        const next = [processed, ...prev]
        return next.slice(0, 500) // Keep last 500
      })

      if (isAttack) {
        setAttackQueue(q => q - 1)
        timeoutId = setTimeout(tick, 180)
      } else {
        // speed formula: 1200 / speed. e.g. speed=1 -> 1.2s, speed=2 -> 0.6s
        const interval = 1200 / (params.simulationSpeed || 1)
        timeoutId = setTimeout(tick, interval)
      }
    }

    const interval = attackQueue > 0 ? 180 : (1200 / (params.simulationSpeed || 1))
    timeoutId = setTimeout(tick, interval)

    return () => clearTimeout(timeoutId)
  }, [isRunning, attackQueue, params.smoteLevel, params.simulationSpeed, processTransaction])

  // Re-process on param change
  useEffect(() => {
    setAllTransactions(prev => [...prev].map(processTransaction))
  }, [params, processTransaction])

  const triggerAttackBurst = useCallback(() => setAttackQueue(10), [])
  const updateParam = useCallback((key, value) => setParams(p => ({ ...p, [key]: value })), [])
  const resetParams = useCallback(() => setParams({
    threshold: 0.50,
    xgbWeight: 0.60,
    smoteLevel: 0.30,
    bufferWidth: 0.10,
    simulationSpeed: 1
  }), [])

  // Derived state
  const transactions = allTransactions.slice(0, 50)
  
  const matrix = useMemo(() => {
    let tp=0, fp=0, fn=0, tn=0
    allTransactions.forEach(t => {
      const predicted = t.decision !== 'APPROVE'
      if (predicted && t.isFraud) tp++
      else if (predicted && !t.isFraud) fp++
      else if (!predicted && t.isFraud) fn++
      else if (!predicted && !t.isFraud) tn++
    })
    const precision = tp+fp > 0 ? tp / (tp+fp) : 1
    const recall = tp+fn > 0 ? tp / (tp+fn) : 1
    const f1 = precision+recall > 0 ? 2*precision*recall / (precision+recall) : 1
    const accuracy = tp+fp+fn+tn > 0 ? (tp+tn)/(tp+fp+fn+tn) : 1
    
    return { tp, fp, fn, tn, precision, recall, f1, accuracy }
  }, [allTransactions])

  const total = allTransactions.length
  const blocked = allTransactions.filter(t => t.decision === 'BLOCK').length
  const flagged = allTransactions.filter(t => t.decision === 'FLAG').length
  const approved = allTransactions.filter(t => t.decision === 'APPROVE').length

  const trends = useMemo(() => {
    const now = Date.now()
    const t30 = allTransactions.filter(t => (now - t.timestamp) <= 30000)
    const t60 = allTransactions.filter(t => (now - t.timestamp) > 30000 && (now - t.timestamp) <= 60000)
    
    const rate = (v) => v.length ? v.filter(t => t.decision !== 'APPROVE').length / v.length : 0
    return {
      blockedRate: t30.length ? t30.filter(t=>t.decision==='BLOCK').length / t30.length : 0,
      flaggedRate: t30.length ? t30.filter(t=>t.decision==='FLAG').length / t30.length : 0,
      volume: t30.length,
      fraudRateNow: rate(t30),
      fraudRatePrev: rate(t60)
    }
  }, [allTransactions])

  const sparkline = useMemo(() => {
    const now = Date.now()
    const buckets = Array.from({length: 12}, () => ({ count: 0, fraud: 0 }))
    allTransactions.forEach(t => {
      const ageSecs = (now - t.timestamp) / 1000
      if (ageSecs <= 60) {
        const bucketIdx = Math.floor(ageSecs / 5)
        if (bucketIdx < 12) {
          buckets[11 - bucketIdx].count++
          if (t.decision !== 'APPROVE') buckets[11 - bucketIdx].fraud++
        }
      }
    })
    return buckets.map((b, i) => ({
      t: i * 5,
      rate: b.count ? b.fraud / b.count : 0
    }))
  }, [allTransactions])

  const histogram = useMemo(() => {
    const bins = Array.from({length: 10}, (_, i) => ({
      bin: i * 0.1,
      label: `${(i*0.1).toFixed(1)}-${((i+1)*0.1).toFixed(1)}`,
      shortLabel: `${(i*0.1).toFixed(1)}`,
      count: 0
    }))
    
    allTransactions.forEach(t => {
      const rawBin = Math.floor(t.ensembleScore / 0.1)
      const binIdx = Math.min(9, rawBin)
      bins[binIdx].count++
    })
    return bins
  }, [allTransactions])

  const clearData = useCallback(() => {
    setAllTransactions([])
  }, [])

  return {
    params, transactions, allTransactions,
    isRunning, selectedTxn,
    matrix, trends, sparkline, histogram,
    total, blocked, flagged, approved,
    setIsRunning, setSelectedTxn, updateParam, resetParams, triggerAttackBurst, clearData
  }
}
