import React from 'react'
import clsx from 'clsx'

export default function Panel({ title, action, children, className }) {
  return (
    <div className={clsx(
      "bg-bg-100 rounded-2xl relative overflow-hidden flex flex-col transition-shadow duration-300",
      className
    )}>
      {/* 1px solid border effect (instead of thick gradient border) */}
      <div className="absolute inset-0 rounded-2xl border border-border pointer-events-none" />

      <div className="p-5 flex-1 flex flex-col relative z-10 w-full">
        {(title || action) && (
          <div className="flex justify-between items-center mb-4">
            {title && <h3 className="section-label">{title}</h3>}
            {action && <div>{action}</div>}
          </div>
        )}
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
