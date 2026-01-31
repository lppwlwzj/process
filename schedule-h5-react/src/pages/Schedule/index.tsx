import { useState, useEffect } from 'react'
import { useScheduleStore } from '@/stores/scheduleStore'
import { getScheduleList } from '@/services/schedule'
import { Schedule } from '@/types/schedule'
import Calendar from '@/components/Calendar'
import dayjs from 'dayjs'
import styles from './index.module.less'

export default function SchedulePage() {
  const {
    scheduleList,
    selectedDate,
    filter,
    setSelectedDate,
  } = useScheduleStore()

  const [allSchedules, setAllSchedules] = useState<Schedule[]>([])

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(dayjs().format('YYYY-MM-DD'))
    }
  }, [])

  useEffect(() => {
    loadAllSchedules()
  }, [])



  const loadAllSchedules = async () => {
    try {
      const currentYear = dayjs().year()
      const startDate = dayjs().year(currentYear).startOf('year').format('YYYY-MM-DD')
      const endDate = dayjs().year(currentYear).endOf('year').format('YYYY-MM-DD')
      
      const res = await getScheduleList({
        dateRange: [startDate, endDate],
        doctor_id: filter.doctor_id,
        room_id: filter.room_id
      })
      if (res.re) {
        setAllSchedules(res.re)
      }
    } catch (error: any) {
      console.error('加载全年排班失败:', error)
    } finally {
    }
  }


  const handleDateChange = (date: string) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const selectedDates = scheduleList.map((item) =>
    item.date || dayjs(item.start_time).format('YYYY-MM-DD')
  )

  return (
    <div className={styles.scheduleContainer}>
      <Calendar
        selectedDates={selectedDates}
        scheduleList={allSchedules}
        onDateChange={handleDateChange}
        onScheduleCreated={loadAllSchedules}
      />

      
      {/* <button
        className={styles.refreshButton}
        onClick={loadAllSchedules}
        disabled={loading}
      >
        刷新
      </button> */}
    </div>
  )
}
