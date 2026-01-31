import { useMemo, ReactNode, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import styles from './index.module.less'
import DateCell from './DateCell'
import ScheduleForm from './ScheduleForm'
import { Schedule } from '@/types/schedule'
import { useNavigate } from 'react-router-dom'
import { request } from '@/utils/request'

interface User {
  id: number
  username: string
  role: string
}
export interface DateInfo {
  date: string
  content?: ReactNode
  backgroundColor?: string
  hasSchedule?: boolean
  isPast?: boolean
}

interface CalendarProps {
  year?: number
  selectedDates?: string[]
  dateInfoMap?: Record<string, DateInfo>
  scheduleList?: Schedule[]
  onDateChange?: (date: string) => void
  onScheduleCreated?: () => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

interface ScheduleContentProps {
  doctorName: string
  time: string
  projectType: string
  scheduleCount?: number
  isPast?: boolean
}

function ScheduleContent({ doctorName, time, projectType, scheduleCount, isPast }: ScheduleContentProps) {
  return (
    <div className={styles.scheduleContent}>
      <span className={styles.scheduleDoctor}>{doctorName}</span>
      <span className={styles.scheduleTime}>{time}</span>
      <span className={styles.scheduleProject}>{projectType}</span>
      {scheduleCount && scheduleCount > 1 && (
        <span className={`${styles.scheduleCount} ${isPast ? styles.isPast : ''}`}>
          {scheduleCount - 1}
        </span>
      )}
    </div>
  )
}

export default function Calendar({
  year = dayjs().year(),
  selectedDates = [],
  dateInfoMap = {},
  scheduleList = [],
  onDateChange: _onDateChange,
  onScheduleCreated,
}: CalendarProps) {
  const today = dayjs().format('YYYY-MM-DD')
  const todayDate = dayjs()
  const navigate = useNavigate()
  const [formVisible, setFormVisible] = useState(false)
  const [doctors, setDoctors] = useState<User[]>([])
  const [nurses, setNurses] = useState<User[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

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

  const processedDateInfoMap = useMemo(() => {
    const result: Record<string, DateInfo> = { ...dateInfoMap }

    if (scheduleList.length > 0) {
      const scheduleByDate: Record<string, Schedule[]> = {}

      scheduleList.forEach((schedule) => {
        const dateStr = schedule.date || dayjs(schedule.start_time).format('YYYY-MM-DD')
        if (!scheduleByDate[dateStr]) {
          scheduleByDate[dateStr] = []
        }
        scheduleByDate[dateStr].push(schedule)
      })

      Object.keys(scheduleByDate).forEach((dateStr) => {
        const schedules = scheduleByDate[dateStr]
        if (schedules.length > 0) {
          const sortedSchedules = [...schedules].sort((a, b) => {
            const timeA = dayjs(a.start_time)
            const timeB = dayjs(b.start_time)
            return timeA.isBefore(timeB) ? -1 : 1
          })

          const firstSchedule = sortedSchedules[0]
          const timeStr = dayjs(firstSchedule.start_time).format('HH:mm')

          const date = dayjs(dateStr)
          const isPast = date.isBefore(todayDate, 'day')
          const backgroundColor = isPast ? '#e8e8e8' : '#e3f2fd'

          const content = (
            <ScheduleContent
              doctorName={firstSchedule.doctor_name || ''}
              time={timeStr}
              projectType={firstSchedule.project_type || ''}
              scheduleCount={schedules.length}
              isPast={isPast}
            />
          )

          result[dateStr] = {
            date: dateStr,
            content,
            backgroundColor,
            hasSchedule: true,
            isPast,
          }
        }
      })
    }

    return result
  }, [scheduleList, dateInfoMap, todayDate])

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = dayjs().year(year).month(monthIndex).startOf('month')
      const daysInMonth = monthStart.daysInMonth()
      const firstDayOfWeek = monthStart.day()

      const days: (dayjs.Dayjs | null)[] = []

      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null)
      }

      for (let i = 1; i <= daysInMonth; i++) {
        days.push(monthStart.date(i))
      }

      return {
        month: monthIndex,
        label: monthStart.format('M月'),
        days,
      }
    })
  }, [year])

  const handleDateClick = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD')
    navigate(`/schedule/detail?date=${dateStr}`)
  }

  const isDateSelected = (date: dayjs.Dayjs) => {
    return selectedDates.includes(date.format('YYYY-MM-DD'))
  }

  const isToday = (date: dayjs.Dayjs) => {
    return date.format('YYYY-MM-DD') === today
  }

  const isWeekend = (date: dayjs.Dayjs) => {
    const day = date.day()
    return day === 0 || day === 6
  }

  const handleFormSuccess = () => {
    setFormVisible(false)
    onScheduleCreated?.()
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.stickyHeader}>
        <div className={styles.headerTop}>
          <div className={styles.yearTitle}>{year}年</div>
          <button 
            className={styles.addButton}
            onClick={() => setFormVisible(true)}
            aria-label="新增排班"
          >
            <span className={styles.addIcon}>+</span>
          </button>
        </div>
        <div className={styles.weekdays}>
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={styles.weekday}
              data-weekend={index === 0 || index === 6}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.monthsContainer}>
        {months.map(({ month, label, days }) => (
          <div key={month} className={styles.monthSection}>
            <div className={styles.monthHeader}>{label}</div>
            <div className={styles.days}>
              {days.map((date, index) => {
                if (!date) {
                  return <DateCell key={`empty-${month}-${index}`} date={0} isEmpty />
                }

                const dateStr = date.format('YYYY-MM-DD')
                const info = processedDateInfoMap[dateStr]

                return (
                  <DateCell
                    key={dateStr}
                    date={date.date()}
                    content={info?.content}
                    backgroundColor={info?.backgroundColor}
                    hasSchedule={info?.hasSchedule}
                    isPast={info?.isPast}
                    isToday={isToday(date)}
                    isSelected={isDateSelected(date)}
                    isWeekend={isWeekend(date)}
                    onClick={() => handleDateClick(date)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <ScheduleForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSuccess={handleFormSuccess}
        doctors={doctors}
        nurses={nurses}
      />
    </div>
  )
}

export { default as DateCell } from './DateCell'
export type { DateCellProps } from './DateCell'
