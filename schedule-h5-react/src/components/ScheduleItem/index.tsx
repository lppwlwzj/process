import { Schedule } from '@/types/schedule'
import dayjs from 'dayjs'
import styles from './index.module.less'

interface ScheduleItemProps {
  schedule: Schedule
  onClick?: () => void
}

export default function ScheduleItem({ schedule, onClick }: ScheduleItemProps) {
  const formatTime = (time: string) => {
    return dayjs(time).format('HH:mm')
  }

  const calculateDuration = () => {
    const start = dayjs(schedule.start_time)
    const end = dayjs(schedule.end_time)
    return end.diff(start, 'minute')
  }

  return (
    <div className={styles.scheduleItemWrapper} onClick={onClick}>
      <div className={styles.timeSection}>
        <div className={styles.time}>{formatTime(schedule.start_time)}</div>
        <div className={styles.duration}>{calculateDuration()}分钟</div>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.infoRow}>
          <span className={styles.label}>医生：</span>
          <span className={styles.value}>{schedule.doctor_name || `ID:${schedule.doctor_id}`}</span>
        </div>
        {schedule.nurse_name && (
          <div className={styles.infoRow}>
            <span className={styles.label}>护士：</span>
            <span className={styles.value}>{schedule.nurse_name}</span>
          </div>
        )}
        <div className={styles.infoRow}>
          <span className={styles.label}>客户：</span>
          <span className={styles.value}>{schedule.customer_name || `ID:${schedule.customer_id}`}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>项目：</span>
          <span className={`${styles.value} ${styles.project}`}>{schedule.project_type}</span>
        </div>
        {schedule.room_name && (
          <div className={styles.infoRow}>
            <span className={styles.label}>诊室：</span>
            <span className={styles.value}>{schedule.room_name}</span>
          </div>
        )}
        {schedule.remark && (
          <div className={styles.infoRow}>
            <span className={styles.label}>备注：</span>
            <span className={`${styles.value} ${styles.remark}`}>{schedule.remark}</span>
          </div>
        )}
      </div>
    </div>
  )
}
