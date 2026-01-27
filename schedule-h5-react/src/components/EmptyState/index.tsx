import styles from './index.module.less'

interface EmptyStateProps {
  icon?: string
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
}

const EmptyState = ({
  icon = '📭',
  title = '暂无数据',
  description,
  actionText,
  onAction
}: EmptyStateProps) => {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.emptyIcon}>{icon}</div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      {description && <p className={styles.emptyDescription}>{description}</p>}
      {actionText && onAction && (
        <button className={styles.actionButton} onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  )
}

export default EmptyState
