import { useCallback } from 'react'
import styles from './index.module.less'

const MIN = -100
const MAX = 100

interface RatingSliderProps {
  value: number
  onChange: (v: number) => void
}

export default function RatingSlider({ value, onChange }: RatingSliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10)
      if (!isNaN(v)) onChange(v)
    },
    [onChange]
  )

  const progress = ((value - MIN) / (MAX - MIN)) * 100

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <div
          className={styles.trackFill}
          style={{ width: `${progress}%` }}
          aria-hidden
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={value}
          onChange={handleChange}
          className={styles.input}
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={value}
        />
      </div>
      <div className={styles.labels}>
        <span>很差</span>
        <span>无感</span>
        <span>很好</span>
      </div>
    </div>
  )
}
