import { ChatMessage as ChatMessageType } from '@/types/chat'
import { confirmSchedule } from '@/services/aiSchedule'
import { useChatStore } from '@/stores/chatStore'
import { showToast } from '@/utils/toast'
import dayjs from 'dayjs'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
        <div className={styles.messageContent}>
          {message.role === 'assistant' ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => <h1 className={styles.markdownH1} {...props} />,
                h2: ({ node, ...props }) => <h2 className={styles.markdownH2} {...props} />,
                h3: ({ node, ...props }) => <h3 className={styles.markdownH3} {...props} />,
                p: ({ node, ...props }) => <p className={styles.markdownP} {...props} />,
                ul: ({ node, ...props }) => <ul className={styles.markdownUl} {...props} />,
                ol: ({ node, ...props }) => <ol className={styles.markdownOl} {...props} />,
                li: ({ node, ...props }) => <li className={styles.markdownLi} {...props} />,
                strong: ({ node, ...props }) => <strong className={styles.markdownStrong} {...props} />,
                em: ({ node, ...props }) => <em className={styles.markdownEm} {...props} />,
                code: ({ node, inline, ...props }: any) => 
                  inline ? (
                    <code className={styles.markdownCodeInline} {...props} />
                  ) : (
                    <code className={styles.markdownCodeBlock} {...props} />
                  ),
                pre: ({ node, ...props }) => <pre className={styles.markdownPre} {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className={styles.markdownBlockquote} {...props} />,
                hr: ({ node, ...props }) => <hr className={styles.markdownHr} {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            message.content
          )}
        </div>
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
