export const generateTransaction = (forceHigh = false, smoteLevel = 0.3) => {
  const timestamp = new Date()
  const amountStr = forceHigh 
    ? (Math.random() * 5000 + 4000).toFixed(2)
    : (Math.random() * 2000 + 5).toFixed(2)
  const amount = parseFloat(amountStr)
  
  const countries = ['MY', 'SG', 'TH', 'ID', 'PH', 'VN', 'MM', 'KH']
  const country = countries[Math.floor(Math.random() * countries.length)]
  
  const categories = ['E-Commerce', 'Food & Bev', 'Gaming', 'Telco Top-up', 'Crypto', 'Remittance', 'Retail', 'Travel']
  const merchantCategory = categories[Math.floor(Math.random() * categories.length)]
  
  const devices = ['Mobile', 'Desktop', 'Tablet', 'API-Direct']
  const deviceType = devices[Math.floor(Math.random() * devices.length)]
  
  const id = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const userId = `USR-${Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
  
  // Base risks
  let baseRisk = Math.random() * 0.3
  if (forceHigh) baseRisk += 0.5
  
  const smoteBoost = Math.random() * smoteLevel * 0.4
  
  let xgbScore = Math.min(1, Math.max(0, baseRisk + (Math.random() * 0.2 - 0.1) + smoteBoost))
  let lgbScore = Math.min(1, Math.max(0, baseRisk + (Math.random() * 0.2 - 0.1) + smoteBoost))
  
  if (forceHigh) {
    xgbScore = Math.min(1, Math.max(0.6, xgbScore + 0.3))
    lgbScore = Math.min(1, Math.max(0.6, lgbScore + 0.3))
  }
  
  const possibleFactors = [
    "High velocity (8 txn/min)", "New device fingerprint", "VPN / proxy detected",
    "Card not present", "Unusual hour (3AM local)", "Amount > 3σ from user avg",
    "Cross-border mismatch", "Multiple failed attempts", "Geolocation jump (420km)",
    "Known BIN pattern", "Disposable email domain", "Mismatched billing ZIP"
  ]
  const isHighRisk = xgbScore > 0.5 || lgbScore > 0.5
  let numFactors = 0
  if (isHighRisk) numFactors = Math.floor(Math.random() * 3) + 1
  else if (Math.random() > 0.8) numFactors = 1
  
  const riskFactors = []
  const factorsCopy = [...possibleFactors]
  for(let i=0; i<numFactors; i++) {
    const idx = Math.floor(Math.random() * factorsCopy.length)
    riskFactors.push(factorsCopy[idx])
    factorsCopy.splice(idx, 1)
  }
  
  return {
    id,
    timestamp,
    amount,
    currency: 'MYR',
    country,
    merchantCategory,
    deviceType,
    userId,
    xgbScore,
    lgbScore,
    riskFactors,
    vpnDetected: riskFactors.includes("VPN / proxy detected"),
    velocityFlag: riskFactors.includes("High velocity (8 txn/min)"),
    newDevice: riskFactors.includes("New device fingerprint"),
    latencyMs: Math.floor(Math.random() * 38) + 12
  }
}
