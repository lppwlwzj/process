import { useState, useRef } from 'react'
import { Schedule } from '@/types/schedule'
import dayjs from 'dayjs'
import { DeleteOutline } from 'antd-mobile-icons'
import styles from './index.module.less'
import { Toast, Dialog } from 'antd-mobile'

interface ScheduleItemProps {
  schedule: Schedule
  onClick?: () => void
  onDelete?: (id: string) => void
}

export default function ScheduleItem({ schedule, onDelete }: ScheduleItemProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const formatTime = (time: string) => {
    return dayjs(time).format('HH:mm')
  }

  const calculateDuration = () => {
    const start = dayjs(schedule.start_time)
    const end = dayjs(schedule.end_time)
    return end.diff(start, 'minute')
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await Dialog.confirm({
      content: '确定要删除这条排班吗？',
    })
    if (result && onDelete) {
      onDelete(schedule.id)
    }
    resetPosition()
  }

  const onClick = () => {
    if (translateX === 0 && schedule.remark) {
      Toast.show(schedule.remark)
    } else if (translateX < 0) {
      resetPosition()
    }
  }

  const resetPosition = () => {
    setTranslateX(0)
    setIsSwiping(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const deltaX = currentX - touchStartX.current
    const deltaY = Math.abs(currentY - touchStartY.current)

    if (deltaY > 10) {
      setIsSwiping(false)
      return
    }

    if (deltaX < 0) {
      const newTranslateX = Math.max(deltaX, -60)
      setTranslateX(newTranslateX)
    } else if (deltaX > 0 && translateX < 0) {
      const newTranslateX = Math.min(translateX + deltaX, 0)
      setTranslateX(newTranslateX)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (translateX < -40) {
      setTranslateX(-60)
    } else {
      resetPosition()
    }
  }

  return (
    <div className={styles.swipeContainer}>
      <div
        ref={wrapperRef}
        className={styles.scheduleItemWrapper}
        style={{ transform: `translateX(${translateX}px)` }}
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.timeSection}>
          <div className={styles.time}>
            {formatTime(schedule.start_time)}
          </div>
        </div>
        <div className={styles.infoSection}>
          <div className={styles.mainInfoRow}>
            <span className={styles.value}>{schedule.doctor_name}</span>
            <span className={styles.separator}></span>
            <span className={`${styles.value}`}>{schedule.project}</span>
            {schedule.nurse_name && (
              <>
                <span className={styles.separator}></span>
                <span className={styles.value}>{schedule.nurse_name}</span>
              </>
            )}
            <span className={styles.separator}></span>
            <span className={styles.value}>{schedule.customer_name}</span>

            {schedule.remark && (
              <span className={styles.remarkRow}>
                <span className={styles.separator}></span>
                <span className={styles.remark}>({schedule.remark})</span>
              </span>
            )}
          </div>
        </div>
      </div>
      <div className={styles.deleteArea}>
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          aria-label="删除排班"
        >
         <DeleteOutline className={styles.deleteIcon} /> 
        </button>
      </div>
    </div>
  )
}
