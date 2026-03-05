import styles from './index.module.less'

interface LoadingProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  fullscreen?: boolean
}

const Loading = ({ size = 'medium', text, fullscreen = false }: LoadingProps) => (
  <div className={`${styles.loadingWrapper} ${fullscreen ? styles.fullscreen : ''}`}>
    <div className={`${styles.spinner} ${styles[size] || styles.medium}`}>
      <div className={styles.dot} />
      <div className={styles.dot} />
      <div className={styles.dot} />
    </div>
    {text && <p className={styles.loadingText}>{text}</p>}
  </div>
)

export default Loading
