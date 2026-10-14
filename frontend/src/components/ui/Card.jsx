import * as React from "react"

const Card = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`glass-card rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-ink)] shadow ${className}`} {...props} />
))
Card.displayName = "Card"

export { Card }
