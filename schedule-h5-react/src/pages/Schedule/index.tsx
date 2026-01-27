import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScheduleStore } from '@/stores/scheduleStore'
import { getScheduleList } from '@/services/schedule'
import { Schedule } from '@/types/schedule'
import { useScroll } from '@/hooks/useScroll'
import Calendar from '@/components/Calendar'
import ScheduleItem from '@/components/ScheduleItem'
import dayjs from 'dayjs'
import styles from './index.module.less'

export default function SchedulePage() {
  const navigate = useNavigate()
  const scheduleScrollRef = useScroll('schedule-page')
  const {
    scheduleList,
    selectedDate,
    filter,
    loading,
    setScheduleList,
    setSelectedDate,
    setFilter,
    setLoading,
    setError
  } = useScheduleStore()

  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [doctorOptions] = useState([
    { value: '', label: '全部' },
    { value: '1', label: '王医生' },
    { value: '2', label: '李医生' }
  ])
  const [roomOptions] = useState([
    { value: '', label: '全部' },
    { value: '1', label: '诊室1' },
    { value: '2', label: '诊室2' },
    { value: '3', label: '诊室3' },
    { value: '4', label: '诊室4' }
  ])

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(dayjs().format('YYYY-MM-DD'))
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      loadScheduleList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, filter])

  const loadScheduleList = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getScheduleList({
        date: selectedDate || undefined,
        doctor_id: filter.doctor_id,
        room_id: filter.room_id
      })
      setScheduleList(list)
    } catch (error: any) {
      setError(error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date: string) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedDoctor(value)
    setFilter({ doctor_id: value || undefined })
  }

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedRoom(value)
    setFilter({ room_id: value || undefined })
  }

  const handleScheduleClick = (schedule: Schedule) => {
    const dateStr = schedule.date || dayjs(schedule.start_time).format('YYYY-MM-DD')
    navigate(`/schedule/detail?date=${dateStr}`)
  }

  const selectedDates = scheduleList.map((item) =>
    item.date || dayjs(item.start_time).format('YYYY-MM-DD')
  )

  return (
    <div className={styles.scheduleContainer} ref={scheduleScrollRef}>
      <div className={styles.filterBar}>
        <select
          value={selectedDoctor}
          onChange={handleDoctorChange}
          className={styles.filterSelect}
        >
          {doctorOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={selectedRoom}
          onChange={handleRoomChange}
          className={styles.filterSelect}
        >
          {roomOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Calendar
        selectedDates={selectedDates}
        onDateChange={handleDateChange}
        showMonth={false}
      />

      <div className={styles.scheduleList}>
        {loading && (
          <div className={styles.loading}>加载中...</div>
        )}
        {!loading && scheduleList.length === 0 && (
          <div className={styles.emptyState}>暂无排班数据</div>
        )}
        {!loading && scheduleList.map((item) => (
          <div key={item.id} className={styles.scheduleItem}>
            <ScheduleItem
              schedule={item}
              onClick={() => handleScheduleClick(item)}
            />
          </div>
        ))}
      </div>
      
      <button
        className={styles.refreshButton}
        onClick={loadScheduleList}
        disabled={loading}
      >
        刷新
      </button>
    </div>
  )
}
