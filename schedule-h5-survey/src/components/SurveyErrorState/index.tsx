import styles from './index.module.less'

export default function SurveyErrorState() {
  return (
    <div className={styles.container}>
      <div className={styles.icon} aria-hidden>📋</div>
      <h2 className={styles.title}>请通过预约二维码进入</h2>
      <p className={styles.desc}>请使用诊所提供的二维码扫码填写服务评价</p>
    </div>
  )
}
