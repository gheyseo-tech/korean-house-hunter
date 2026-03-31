import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
}

export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(value === n ? 0 : n)}
          disabled={!onChange}
          className="p-0 disabled:cursor-default"
        >
          <Star
            size={size}
            className={n <= value ? 'text-warning fill-warning' : 'text-border'}
          />
        </button>
      ))}
    </div>
  )
}
