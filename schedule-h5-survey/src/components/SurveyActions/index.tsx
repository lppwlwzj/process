import styles from './index.module.less'

interface SurveyActionsProps {
  onReset: () => void
  onSubmit: () => void
  canSubmit: boolean
  submitting: boolean
}

export default function SurveyActions({
  onReset,
  onSubmit,
  canSubmit,
  submitting
}: SurveyActionsProps) {
  const handleSubmit = () => {
    if (!canSubmit || submitting) return
    onSubmit()
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.resetBtn}
        onClick={onReset}
        disabled={submitting}
        aria-label="清空重填"
      >
        清空重填
      </button>
      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        aria-label="提交评价"
      >
        {submitting ? '提交中...' : '提交'}
      </button>
    </div>
  )
}
