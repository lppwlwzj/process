import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useScheduleStore } from '@/stores/scheduleStore'
import { getScheduleList } from '@/services/schedule'
import { Schedule } from '@/types/schedule'
import ScheduleItem from '@/components/ScheduleItem'
import dayjs from 'dayjs'
import styles from './index.module.less'

interface GroupedSchedules {
  morning: Schedule[]
  afternoon: Schedule[]
}

export default function ScheduleDetailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    scheduleList,
    setScheduleList,
    setLoading,
    setError
  } = useScheduleStore()

  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get('date') || dayjs().format('YYYY-MM-DD')
  )

  useEffect(() => {
    loadScheduleList()
  }, [selectedDate])

  const loadScheduleList = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getScheduleList({
        date: selectedDate
      })
      setScheduleList(list)
    } catch (error: any) {
      setError(error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const groupByTimeSlot = (schedules: Schedule[]): GroupedSchedules => {
    const morning: Schedule[] = []
    const afternoon: Schedule[] = []

    schedules.forEach((schedule) => {
      const hour = dayjs(schedule.start_time).hour()
      if (hour >= 0 && hour < 12) {
        morning.push(schedule)
      } else if (hour >= 12 && hour < 19) {
        afternoon.push(schedule)
      }
    })

    morning.sort((a, b) =>
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
    )
    afternoon.sort((a, b) =>
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
    )

    return { morning, afternoon }
  }

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY年MM月DD日')
  }

  const handleBack = () => {
    navigate(-1)
  }

  const groupedSchedules = groupByTimeSlot(scheduleList)

  return (
    <div className={styles.detailContainer}>
      <div className={styles.dateHeader}>
        <button className={styles.backButton} onClick={handleBack}>
          ← 返回
        </button>
        <div className={styles.dateText}>{formatDate(selectedDate)}</div>
      </div>

      {groupedSchedules.morning.length > 0 && (
        <div className={styles.periodSection}>
          <div className={styles.periodTitle}>早上 (00:00-12:00)</div>
          {groupedSchedules.morning.map((item) => (
            <div key={item.id} className={styles.scheduleItem}>
              <ScheduleItem schedule={item} />
            </div>
          ))}
        </div>
      )}

      {groupedSchedules.afternoon.length > 0 && (
        <div className={styles.periodSection}>
          <div className={styles.periodTitle}>下午 (12:00-19:00)</div>
          {groupedSchedules.afternoon.map((item) => (
            <div key={item.id} className={styles.scheduleItem}>
              <ScheduleItem schedule={item} />
            </div>
          ))}
        </div>
      )}

      {groupedSchedules.morning.length === 0 && groupedSchedules.afternoon.length === 0 && (
        <div className={styles.emptyState}>该日期暂无排班</div>
      )}
    </div>
  )
}
