export type MessageRole = 'user' | 'assistant'
export type MessageType = 'text' | 'confirm' | 'error'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  type?: MessageType
  scheduleData?: SuggestedSchedule
  isStreaming?: boolean
}

export interface SuggestedSchedule {
  project: string
  doctor_id: number
  doctor_name: string
  nurse_id?: number
  nurse_name?: string
  customer_id: number
  customer_name: string
  room: string
  start_time: string
  duration: number
  remark?: string
}
