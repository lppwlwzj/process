import { useState, useCallback, useRef, useEffect } from 'react'
import Recorder from 'recorder-js'
import styles from './index.module.less'

interface AudioRecorderProps {
  onRecordingChange?: (blob: Blob | null) => void
}

export default function AudioRecorder({ onRecordingChange }: AudioRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'ready'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const recorderRef = useRef<Recorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const initRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      const recorder = new Recorder(ctx)
      await recorder.init(stream)
      recorderRef.current = recorder
      setError(null)
      return true
    } catch (e) {
      setError('无法访问麦克风，请检查权限设置')
      return false
    }
  }, [])

  const handleStart = useCallback(async () => {
    if (status === 'recording') return
    if (!recorderRef.current && !(await initRecorder())) return
    if (!recorderRef.current) return
    blobRef.current = null
    onRecordingChange?.(null)
    try {
      await recorderRef.current.start()
      setStatus('recording')
      setDuration(0)
      durationTimerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch (e) {
      setError('开始录音失败')
    }
  }, [status, initRecorder, onRecordingChange])

  const handleStop = useCallback(async () => {
    if (status !== 'recording' || !recorderRef.current) return
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }
    try {
      const { blob } = await recorderRef.current.stop()
      blobRef.current = blob
      onRecordingChange?.(blob)
      setStatus('ready')
    } catch (e) {
      setError('停止录音失败')
      setStatus('idle')
    }
  }, [status, onRecordingChange])

  const handleDelete = useCallback(() => {
    blobRef.current = null
    onRecordingChange?.(null)
    setStatus('idle')
    setDuration(0)
  }, [onRecordingChange])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>语音反馈</h3>
      <p className={styles.desc}>可录制您的补充意见（选填）</p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.controls}>
        {status === 'idle' && (
          <button
            type="button"
            className={styles.recordBtn}
            onClick={handleStart}
            aria-label="开始录音"
          >
            <span className={styles.micIcon}>🎤</span>
            开始录音
          </button>
        )}
        {status === 'recording' && (
          <>
            <div className={styles.recordingIndicator}>
              <span className={styles.dot} />
              {formatDuration(duration)}
            </div>
            <button
              type="button"
              className={styles.stopBtn}
              onClick={handleStop}
              aria-label="停止录音"
            >
              停止
            </button>
          </>
        )}
        {status === 'ready' && (
          <div className={styles.readyRow}>
            <span className={styles.readyLabel}>✓ 已录制</span>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDelete}
              aria-label="删除重录"
            >
              删除重录
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
