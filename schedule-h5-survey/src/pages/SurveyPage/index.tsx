import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import RatingCard from '@/components/RatingCard'
import SurveyErrorState from '@/components/SurveyErrorState'
import SurveyActions from '@/components/SurveyActions'
import AudioRecorder from '@/components/AudioRecorder'
import { SURVEY_ROLES, INITIAL_RATINGS } from '@/types/survey'
import type { SurveyRating } from '@/types/survey'
import { submitSurvey } from '@/services/survey'
import { showToast } from '@/utils/toast'
import styles from './index.module.less'

function useCustomerId(): string | null {
  const [params] = useSearchParams()
  const customerId = params.get('customer_id') || params.get('cid')
  if (!customerId || !customerId.trim()) return null
  return customerId.trim()
}

export default function SurveyPage() {
  const customerId = useCustomerId()
  const [ratings, setRatings] = useState<SurveyRating>(() => ({ ...INITIAL_RATINGS }))
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = Object.values(ratings).every((v) => v !== undefined && !isNaN(v))

  const handleChange = useCallback((key: keyof SurveyRating, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setRatings({ ...INITIAL_RATINGS })
    setAudioBlob(null)
    setResetKey((k) => k + 1)
    showToast({ title: '已清空，请重新填写', icon: 'none' })
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!customerId || !canSubmit || submitting) return
    setSubmitting(true)
    try {
      const res = await submitSurvey(customerId, ratings, audioBlob)
      if (audioBlob) {
        console.log('[survey] 录音上传结果 audio_url=', (res as { audio_url?: string | null })?.audio_url ?? '无')
      }
      showToast({ title: '感谢您的评价！', icon: 'success' })
      setRatings({ ...INITIAL_RATINGS })
      setAudioBlob(null)
      setResetKey((k) => k + 1)
    } catch (e) {
      showToast({
        title: e instanceof Error ? e.message : '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }, [customerId, ratings, audioBlob, canSubmit, submitting])

  if (!customerId) {
    return <SurveyErrorState />
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>服务评价</h1>
      </header>
      <main className={styles.main}>
        <p className={styles.tip}>
          这次的体验反馈表，恳请您真实填写哦！为了能让您下次来戴牙或者保养时有更好的体验感，您的意见很重要！
        </p>
        {SURVEY_ROLES.map(({ key, label }, index) => (
          <RatingCard
            key={key}
            label={label}
            value={ratings[key]}
            onChange={(v) => handleChange(key, v)}
            index={index}
          />
        ))}
        <AudioRecorder key={resetKey} onRecordingChange={setAudioBlob} />
      </main>
      <SurveyActions
        onReset={handleReset}
        onSubmit={handleSubmit}
        canSubmit={canSubmit}
        submitting={submitting}
      />
    </div>
  )
}
