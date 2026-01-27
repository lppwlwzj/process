import { ChatMessage as ChatMessageType } from '@/types/chat'
import { confirmSchedule } from '@/services/aiSchedule'
import { useChatStore } from '@/stores/chatStore'
import { showToast } from '@/utils/toast'
import dayjs from 'dayjs'
import clsx from 'clsx'
import styles from './index.module.less'

interface ChatMessageProps {
  message: ChatMessageType
  onConfirmed?: () => void
}

export default function ChatMessage({ message, onConfirmed }: ChatMessageProps) {
  const { sessionId, updateMessage } = useChatStore()

  const formatTime = (timestamp: number) => {
    return dayjs(timestamp).format('HH:mm')
  }

  const handleConfirm = async () => {
    if (!message.scheduleData || !sessionId) return

    try {
      await confirmSchedule({
        session_id: sessionId,
        suggested_schedule: message.scheduleData,
        is_vip_priority: message.content.includes('优先')
      })
      
      updateMessage(message.id, { type: 'text' })
      onConfirmed?.()
      showToast({
        title: '排班创建成功',
        icon: 'success'
      })
    } catch (error: any) {
      showToast({
        title: error.message || '创建失败',
        icon: 'none'
      })
    }
  }

  const handleCancel = () => {
    updateMessage(message.id, { type: 'text' })
  }

  return (
    <div className={clsx(styles.messageWrapper, styles[message.role])}>
      <div className={clsx(styles.messageBubble, message.type && styles[message.type])}>
        <div className={styles.messageContent}>{message.content}</div>
        <div className={styles.messageTime}>{formatTime(message.timestamp)}</div>
        {message.type === 'confirm' && message.scheduleData && (
          <div className={styles.confirmActions}>
            <button className={styles.confirmBtn} onClick={handleConfirm}>
              确认创建
            </button>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
