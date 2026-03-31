interface ScoreBarProps {
  label: string
  score: number  // 0-100
  color?: string
}

export function ScoreBar({ label, score, color = 'bg-primary' }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-secondary w-12 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{score}</span>
    </div>
  )
}
