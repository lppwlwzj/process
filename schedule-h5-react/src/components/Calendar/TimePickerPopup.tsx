import { useState, useEffect } from 'react'
import { Popup, DatePickerView, Button } from 'antd-mobile'
import dayjs from 'dayjs'
import styles from './TimePickerPopup.module.less'

const MINUTE_SHORTCUTS = [0, 15, 30, 45]

interface TimePickerPopupProps {
  visible: boolean
  onClose: () => void
  value: Date | null
  onConfirm: (date: Date) => void
  min?: Date
  max?: Date
  title: string
}

export default function TimePickerPopup({
  visible,
  onClose,
  value,
  onConfirm,
  min,
  max,
  title
}: TimePickerPopupProps) {
  const [tempValue, setTempValue] = useState<Date>(() =>
    value ? new Date(value.getTime()) : min ? new Date(min.getTime()) : dayjs().startOf('hour').toDate()
  )

  useEffect(() => {
    if (visible) {
      const base = value || min || dayjs().startOf('day').hour(9).minute(0).toDate()
      setTempValue(new Date(base.getTime()))
    }
  }, [visible, value, min])

  const handleShortcut = (minute: number) => {
    setTempValue((prev) => dayjs(prev).minute(minute).second(0).millisecond(0).toDate())
  }

  const handleConfirm = () => {
    onConfirm(tempValue)
    onClose()
  }

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <span className={styles.closeBtn} onClick={onClose}>
            关闭
          </span>
        </div>
        <div className={styles.shortcuts}>
          {MINUTE_SHORTCUTS.map((m) => (
            <button
              key={m}
              type="button"
              className={styles.shortcutBtn}
              onClick={() => handleShortcut(m)}
            >
              {m.toString().padStart(2, '0')}分
            </button>
          ))}
        </div>
        <div className={styles.pickerWrap}>
          <DatePickerView
            value={tempValue}
            onChange={(v) => setTempValue(v as Date)}
            min={min}
            max={max}
            precision="minute"
          />
        </div>
        <div className={styles.footer}>
          <Button className={styles.confirmBtn} onClick={handleConfirm}>
            确定
          </Button>
        </div>
      </div>
    </Popup>
  )
}
