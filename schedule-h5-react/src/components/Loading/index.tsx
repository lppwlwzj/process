import styles from './index.module.less'

interface LoadingProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  fullscreen?: boolean
}

const Loading = ({ size = 'medium', text, fullscreen = false }: LoadingProps) => {
  const sizeClass = styles[size] || styles.medium

  const content = (
    <div className={`${styles.loadingWrapper} ${fullscreen ? styles.fullscreen : ''}`}>
      <div className={`${styles.spinner} ${sizeClass}`}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  )

  return content
}

export default Loading
