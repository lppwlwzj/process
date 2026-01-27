import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import clsx from 'clsx'
import styles from './index.module.less'

interface CalendarProps {
  selectedDates?: string[]
  onDateChange?: (date: string) => void
  showMonth?: boolean
}

export default function Calendar({ selectedDates = [], onDateChange, showMonth = true }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const startOfMonth = currentMonth.startOf('month')
  const daysInMonth = currentMonth.daysInMonth()
  const firstDayOfWeek = startOfMonth.day()

  const days: (dayjs.Dayjs | null)[] = []
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(startOfMonth.date(i))
  }

  const handleDateClick = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD')
    if (selectedDate === dateStr) {
      setSelectedDate(null)
      onDateChange?.('')
    } else {
      setSelectedDate(dateStr)
      onDateChange?.(dateStr)
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, 'month'))
  }

  const isDateSelected = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD')
    return selectedDates.includes(dateStr) || selectedDate === dateStr
  }

  const isToday = (date: dayjs.Dayjs) => {
    return date.isSame(dayjs(), 'day')
  }

  return (
    <div className={styles.calendar}>
      {showMonth && (
        <div className={styles.header}>
          <button className={styles.navButton} onClick={handlePrevMonth}>‹</button>
          <div className={styles.monthYear}>
            {currentMonth.format('YYYY年MM月')}
          </div>
          <button className={styles.navButton} onClick={handleNextMonth}>›</button>
        </div>
      )}
      
      <div className={styles.weekdays}>
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>
      
      <div className={styles.days}>
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className={styles.day} />
          }
          
          return (
            <div
              key={date.format('YYYY-MM-DD')}
              className={clsx(
                styles.day,
                isToday(date) && styles.today,
                isDateSelected(date) && styles.selected
              )}
              onClick={() => handleDateClick(date)}
            >
              {date.date()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
