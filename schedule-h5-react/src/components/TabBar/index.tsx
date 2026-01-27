import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import styles from './index.module.less'
import chatIcon from '@/assets/ECO-UI-22.pic.jpg'
import scheduleIcon from '@/assets/ECO-UI-18.png'

interface TabItem {
  path: string
  label: string
  icon: string
  activeIcon: string
}

const tabs: TabItem[] = [
  {
    path: '/chat',
    label: '对话',
    icon: chatIcon,
    activeIcon: chatIcon
  },
  {
    path: '/schedule',
    label: '日程',
    icon: scheduleIcon,
    activeIcon: scheduleIcon
  } 
]

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/chat') {
      return location.pathname === '/' || location.pathname === '/chat'
    }
    return location.pathname.startsWith(path)
  }

  const handleTabClick = (path: string) => {
    navigate(path)
  }

  return (
    <div className={styles.tabBar}>
      {tabs.map((tab) => {
        const active = isActive(tab.path)
        return (
          <div
            key={tab.path}
            className={clsx(styles.tabItem, active && styles.active)}
            onClick={() => handleTabClick(tab.path)}
          >
            <img
              src={active ? tab.activeIcon : tab.icon}
              alt={tab.label}
              className={styles.tabIcon}
            />
            <span className={styles.tabLabel}>{tab.label}</span>
          </div>
        )
      })}
    </div>
  )
}
