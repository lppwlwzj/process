import { streamSSE } from '@/utils/sse'
import { request } from '@/utils/request'
import { SuggestedSchedule } from '@/types/chat'

export async function* sendChatMessage(
  params: {
    session_id?: string
    message: string
    user_id?: number
  }
): AsyncGenerator<any, void, unknown> {
  yield* streamSSE('/api/ai-schedule/chat', params)
}

export function confirmSchedule(data: {
  session_id: string
  suggested_schedule: SuggestedSchedule
  is_vip_priority?: boolean
}) {
  return request({
    url: '/api/ai-schedule/confirm',
    method: 'POST',
    data
  })
}

export function getChatHistory(sessionId: string) {
  return request({
    url: `/ai-schedule/history/${sessionId}`,
    method: 'GET'
  })
}

export function deleteSession(sessionId: string) {
  return request({
    url: `/ai-schedule/session/${sessionId}`,
    method: 'DELETE'
  })
}
