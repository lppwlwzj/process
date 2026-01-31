import { useState, useEffect, useRef } from 'react'
import { TextArea, SpinLoading, Dialog } from 'antd-mobile'
import { SendOutline, DeleteOutline } from 'antd-mobile-icons'
import { useChatStore } from '@/stores/chatStore'
import { useSSE } from '@/hooks/useSSE'
import { getChatHistory, deleteSession } from '@/services/aiSchedule'
import { useScroll } from '@/hooks/useScroll'
import ChatMessage from '@/components/ChatMessage'
import type { ChatMessage as ChatMessageType } from '@/types/chat'
import styles from './index.module.less'

export default function ChatPage() {
  const { messages, sessionId, isConnecting, setSessionId, addMessage, clearMessages } = useChatStore()
  const { sendMessage } = useSSE()
  const [inputMessage, setInputMessage] = useState('')
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useScroll('chat-page')

  useEffect(() => {
    loadSessionId()
  }, [])

  useEffect(() => {
    if (sessionId && !historyLoaded) {
      loadHistory()
      setHistoryLoaded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadSessionId = () => {
    const saved = localStorage.getItem('chat_session_id')
    if (saved) {
      setSessionId(saved)
    }
  }

  const loadHistory = async () => {
    if (!sessionId || historyLoaded) return
    try {
      const history = await getChatHistory(sessionId)
      if (history && history.messages && Array.isArray(history.messages) && history.messages.length > 0) {
        clearMessages()
        const formattedMessages: ChatMessageType[] = history.messages.map((msg: any) => ({
          id: msg.id || `${Date.now()}-${Math.random()}`,
          role: msg.role || 'assistant',
          content: msg.content || '',
          timestamp: msg.timestamp || Date.now(),
          type: msg.type || 'text',
          scheduleData: msg.scheduleData || msg.metadata?.suggested_schedule,
          isStreaming: false
        }))
        formattedMessages.forEach((msg: ChatMessageType) => {
          addMessage(msg)
        })
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!inputMessage.trim() || isConnecting) return

    const message = inputMessage.trim()
    setInputMessage('')

    await sendMessage(message, sessionId || undefined)
  }


  const handleConfirmed = () => {
    console.log('Schedule confirmed')
  }

  const handleClearMessages = async () => {
    const result = await Dialog.confirm({
      content: '确定要清除所有对话记录吗？',
      confirmText: '清除',
      cancelText: '取消',
    })
    if (result) {
      try {
        if (sessionId) {
          await deleteSession(sessionId)
        }
      } catch (error) {
        console.error('删除会话失败:', error)
      } finally {
        clearMessages()
        localStorage.removeItem('chat_session_id')
        setSessionId('')
        setHistoryLoaded(false)
      }
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList} ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <div className={styles.emptyText}>开始与AI助手对话</div>
            <div className={styles.emptyHint}>输入您的问题，AI将为您安排排班</div>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`${styles.messageItem} ${styles[msg.role]}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <ChatMessage message={msg} onConfirmed={handleConfirmed} />
          </div>
        ))}
        {isConnecting && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className={styles.typingText}>AI正在解析...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputCard}>
          <div className={styles.inputHeader}>
            <span className={styles.inputLabel}>发送消息</span>
            <button
              className={styles.clearButton}
              onClick={handleClearMessages}
              disabled={messages.length === 0}
              aria-label="清除对话"
            >
              <DeleteOutline fontSize={16} />
              <span>清除</span>
            </button>
          </div>
          <div className={styles.inputWrapper}>
            <TextArea
              value={inputMessage}
              onChange={(val) => setInputMessage(val)}
              placeholder="输入您的排班需求，例如：帮我安排明天下午于医生的面诊..."
              disabled={isConnecting}
              className={styles.input}
              autoSize={{ minRows: 2, maxRows: 5 }}
              rows={2}
            />
            <div className={styles.inputActions}>
              <button
                className={`${styles.sendButton} ${(!inputMessage.trim() || isConnecting) ? styles.disabled : ''}`}
                onClick={handleSend}
                disabled={isConnecting || !inputMessage.trim()}
                aria-label="发送消息"
              >
                {isConnecting ? (
                  <SpinLoading style={{ '--size': '18px', '--color': '#fff' } as React.CSSProperties} />
                ) : (
                  <SendOutline fontSize={18} style={{ color: '#333' } as React.CSSProperties} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
