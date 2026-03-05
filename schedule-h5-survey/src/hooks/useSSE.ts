import { useEffect, useRef } from 'react'
import { sendChatMessage } from '@/services/aiSchedule'
import { useChatStore } from '@/stores/chatStore'
import { ChatMessage } from '@/types/chat'

export function useSSE() {
  const { addMessage, updateMessage, setConnecting, setError, setSessionId } = useChatStore()
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = async (
    message: string,
    sessionId?: string,
    userId?: number
  ) => {
    abortControllerRef.current = new AbortController()
    setConnecting(true)
    setError(null)

    try {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: Date.now()
      }
      addMessage(userMessage)

      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      }
      addMessage(assistantMessage)

      let accumulatedContent = ''

      for await (const chunk of sendChatMessage({
        session_id: sessionId,
        message,
        user_id: userId
      })) {
        if (chunk.type === 'chunk' && chunk.content) {
          accumulatedContent += chunk.content
          updateMessage(assistantMessageId, {
            content: accumulatedContent
          })
        } else if (chunk.type === 'complete' && chunk.data) {
          const finalContent = chunk.data.response || accumulatedContent
          const scheduleData = chunk.data.suggested_schedule
          const requiresConfirmation = chunk.data.requires_confirmation

          updateMessage(assistantMessageId, {
            content: finalContent,
            isStreaming: false,
            scheduleData: scheduleData,
            type: requiresConfirmation ? 'confirm' : 'text'
          })

          if (chunk.data.session_id) {
            setSessionId(chunk.data.session_id)
            localStorage.setItem('chat_session_id', chunk.data.session_id)
          }
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || '发送消息失败'
      setError(errorMessage)

      const store = useChatStore.getState()
      const streamingMessage = store.messages.find((msg) => msg.isStreaming)

      if (streamingMessage) {
        updateMessage(streamingMessage.id, {
          isStreaming: false,
          type: 'error',
          content: errorMessage
        })
      } else {
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMessage,
          timestamp: Date.now(),
          type: 'error'
        })
      }
    } finally {
      setConnecting(false)
    }
  }

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return { sendMessage }
}
