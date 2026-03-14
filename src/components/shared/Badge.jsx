import React from 'react'
import clsx from 'clsx'

export default function Badge({ decision }) {
  const isApprove = decision === 'APPROVE' || decision === 'LOW'
  const isFlag = decision === 'FLAG' || decision === 'MEDIUM'
  const isBlock = decision === 'BLOCK' || decision === 'HIGH' || decision === 'CRITICAL'

  return (
    <span className={clsx(
      "px-2 py-[2px] rounded-pill font-mono text-[10px] whitespace-nowrap border font-bold uppercase tracking-wider",
      {
        'bg-[#dcfce7] text-[#15803d] border-[#86efac]': isApprove,
        'bg-[#fef3c7] text-[#b45309] border-[#fcd34d]': isFlag,
        'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]': isBlock,
        'bg-bg-200 text-text-secondary border-border-md': !isApprove && !isFlag && !isBlock
      }
    )}>
      {decision}
    </span>
  )
}
