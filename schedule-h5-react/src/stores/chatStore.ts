import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatMessage } from '@/types/chat'

interface ChatStoreState {
  sessionId: string
  messages: ChatMessage[]
  isConnecting: boolean
  error: string | null
  setSessionId: (id: string) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  clearMessages: () => void
  setConnecting: (connecting: boolean) => void
  setError: (error: string | null) => void
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set) => ({
      sessionId: '',
      messages: [],
      isConnecting: false,
      error: null,
      setSessionId: (id) => set({ sessionId: id }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          )
        })),
      clearMessages: () => set({ messages: [] }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setError: (error) => set({ error })
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        messages: state.messages
      })
    }
  )
)
