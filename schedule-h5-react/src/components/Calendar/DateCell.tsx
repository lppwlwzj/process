import { ReactNode } from 'react'
import clsx from 'clsx'
import styles from './DateCell.module.less'

export interface DateCellProps {
  date: number
  content?: ReactNode
  backgroundColor?: string
  hasSchedule?: boolean
  isPast?: boolean
  isToday?: boolean
  isSelected?: boolean
  isWeekend?: boolean
  isEmpty?: boolean
  isSelectMode?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export default function DateCell({
  date,
  content,
  backgroundColor,
  hasSchedule = false,
  isPast = false,
  isToday = false,
  isSelected = false,
  isWeekend = false,
  isEmpty = false,
  isSelectMode = false,
  onClick,
}: DateCellProps) {
  if (isEmpty) {
    return <div className={[styles.cell, styles.empty].join(' ')} />
  }

  return (
    <div
      className={clsx(
        styles.cell,
        isToday && styles.today,
        isSelected && styles.selected,
        isWeekend && styles.weekend,
        hasSchedule && styles.hasSchedule,
        isPast && styles.isPast,
        content && styles.hasContent,
        isSelectMode && styles.selectMode
      )}
      onClick={onClick}
    >
      <span className={styles.date}>{date}</span>
      {isSelectMode && (
        <div className={clsx(styles.checkbox, isSelected && styles.checked)}>
          {isSelected && <span className={styles.checkIcon}>✓</span>}
        </div>
      )}
      {content && <div className={styles.content}>{content}</div>}
    </div>
  )
}
