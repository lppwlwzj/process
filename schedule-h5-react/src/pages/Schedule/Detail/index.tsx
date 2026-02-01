import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useScheduleStore } from '@/stores/scheduleStore'
import { getScheduleList, deleteSchedule } from '@/services/schedule'
import { Schedule } from '@/types/schedule'
import ScheduleItem from '@/components/ScheduleItem'
import ScheduleForm from '@/components/Calendar/ScheduleForm'
import dayjs from 'dayjs'
import { Toast } from 'antd-mobile'
import { request } from '@/utils/request'
import styles from './index.module.less'

interface User {
  id: number
  username: string
  role: string
}

interface GroupedSchedules {
  morning: Schedule[]
  afternoon: Schedule[]
  evening: Schedule[]
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

  const [selectedDate] = useState<string>(
    searchParams.get('date') || dayjs().format('YYYY-MM-DD')
  )
  const [formVisible, setFormVisible] = useState(false)
  const [doctors, setDoctors] = useState<User[]>([])
  const [nurses, setNurses] = useState<User[]>([])

  useEffect(() => {
    loadScheduleList()
    loadUsers()
  }, [selectedDate])

  const loadScheduleList = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getScheduleList({
        date: selectedDate
      })
      setScheduleList(res.re)
    } catch (error: any) {
      setError(error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await request({
        url: '/user/list',
        method: 'POST'
      })
      if (res.re) {
        setDoctors(res.re.filter((u: User) => u.role === '医生椅旁技师'))
        setNurses(res.re.filter((u: User) => u.role === '护士'))
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
    }
  }

  const groupByTimeSlot = (schedules: Schedule[]): GroupedSchedules => {
    const morning: Schedule[] = []
    const afternoon: Schedule[] = []
    const evening: Schedule[] = []

    schedules.forEach((schedule) => {
      const hour = dayjs(schedule.start_time).hour()
      if (hour >= 0 && hour < 12) {
        morning.push(schedule)
      } else if (hour >= 12 && hour < 17) {
        afternoon.push(schedule)
      } else if (hour >= 17 && hour < 21) {
        evening.push(schedule)
      }
    })

    morning.sort((a, b) =>
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
    )
    afternoon.sort((a, b) =>
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
    )
    evening.sort((a, b) =>
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
    )

    return { morning, afternoon, evening }
  }

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY年MM月DD日')
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteSchedule(Number(id))
      if (res.code === 0) {
        Toast.show('删除成功')
        loadScheduleList()
      } else {
        Toast.show(res.message || '删除失败')
      }
    } catch (error: any) {
      Toast.show(error.message || '删除失败')
    }
  }

  const handleFormSuccess = () => {
    loadScheduleList()
  }

  const groupedSchedules = groupByTimeSlot(scheduleList)

  return (
    <div className={styles.detailContainer}>
      <div className={styles.dateHeader}>
        <button className={styles.backButton} onClick={handleBack}>
          ← 返回
        </button>
        <div className={styles.dateText}>{formatDate(selectedDate)}</div>
        <button className={styles.addButton} onClick={() => setFormVisible(true)}>
          + 新增
        </button>
      </div>

      {groupedSchedules.morning.length > 0 && (
        <div className={styles.periodSection}>
          <div className={styles.periodTitle}>早上 (00:00-12:00)</div>
          {groupedSchedules.morning.map((item) => (
            <div key={item.id} className={styles.scheduleItem}>
              <ScheduleItem schedule={item} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}

      {groupedSchedules.afternoon.length > 0 && (
        <div className={styles.periodSection}>
          <div className={styles.periodTitle}>下午 (12:00-17:00)</div>

          {groupedSchedules.afternoon.map((item) => (
            <div key={item.id} className={styles.scheduleItem}>
              <ScheduleItem schedule={item} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}

      {groupedSchedules.evening.length > 0 && (
        <div className={styles.periodSection}>
          <div className={styles.periodTitle}>晚上 (17:00-21:00)</div>

          {groupedSchedules.evening.map((item) => (
            <div key={item.id} className={styles.scheduleItem}>
              <ScheduleItem schedule={item} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}

      {groupedSchedules.morning.length === 0 && groupedSchedules.afternoon.length === 0 && groupedSchedules.evening.length === 0 && (
        <div className={styles.emptyState}>该日期暂无排班</div>
      )}

      <ScheduleForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSuccess={handleFormSuccess}
        doctors={doctors}
        nurses={nurses}
        defaultDate={selectedDate}
      />
    </div>
  )
}
