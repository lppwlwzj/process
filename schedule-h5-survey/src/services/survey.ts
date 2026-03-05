import request from '@/utils/request'
import type { SurveyRating } from '@/types/survey'

export const submitSurvey = (
  customerId: string,
  ratings: SurveyRating,
  audioBlob?: Blob | null
) => {
  const form = new FormData()
  form.append('customer_id', customerId)
  form.append('ratings', JSON.stringify(ratings))
  if (audioBlob) {
    form.append('audio', audioBlob, 'feedback.wav')
  }
  return request.post('/survey/submit', form)
}
