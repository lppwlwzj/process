import RatingSlider from '@/components/RatingSlider'
import styles from './index.module.less'

interface RatingCardProps {
  label: string
  value: number
  onChange: (v: number) => void
  index: number
}

export default function RatingCard({ label, value, onChange, index }: RatingCardProps) {
  const scoreClass = value < 0 ? styles.negative : styles.positive

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <h3 className={styles.label}>{label}</h3>
      <div className={styles.scoreWrap}>
        <span className={`${styles.score} ${scoreClass}`}>{value}</span>
      </div>
      <RatingSlider value={value} onChange={onChange} />
    </article>
  )
}
