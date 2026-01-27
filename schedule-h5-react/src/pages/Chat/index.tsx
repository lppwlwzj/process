import { useState, useEffect, useRef } from 'react'
import { Input, Button, SpinLoading } from 'antd-mobile'
import { SendOutline } from 'antd-mobile-icons'
import { useChatStore } from '@/stores/chatStore'
import { useSSE } from '@/hooks/useSSE'
import { getChatHistory } from '@/services/aiSchedule'
import { useScroll } from '@/hooks/useScroll'
import ChatMessage from '@/components/ChatMessage'
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
        const formattedMessages = history.messages.map((msg: any) => ({
          id: msg.id || `${Date.now()}-${Math.random()}`,
          role: msg.role || 'assistant',
          content: msg.content || '',
          timestamp: msg.timestamp || Date.now(),
          type: msg.type || 'text',
          scheduleData: msg.scheduleData || msg.metadata?.suggested_schedule,
          isStreaming: false
        }))
        formattedMessages.forEach((msg) => {
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
            <span className={styles.typingText}>AI正在输入...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <Input
            value={inputMessage}
            onChange={(val) => setInputMessage(val)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="输入消息..."
            disabled={isConnecting}
            className={styles.input}
            clearable
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={isConnecting || !inputMessage.trim()}
          className={styles.sendButton}
          color="primary"
          shape="rounded"
        >
          {isConnecting ? (
            <SpinLoading style={{ '--size': '16px' }} />
          ) : (
            <SendOutline fontSize={18} />
          )}
        </Button>
      </div>
    </div>
  )
}
