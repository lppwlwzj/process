import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import Loading from '@/components/Loading'
import TabBar from '@/components/TabBar'
import useOnline from '@/hooks/useOnline'
import './styles/index.less'

const ChatPage = lazy(() => import('@/pages/Chat'))
const SchedulePage = lazy(() => import('@/pages/Schedule'))
const ScheduleDetailPage = lazy(() => import('@/pages/Schedule/Detail'))

function OfflineBanner() {
  const { isOffline } = useOnline()

  if (!isOffline) return null

  return (
    <div className="offline-banner" role="alert" aria-live="polite">
      网络连接已断开，部分功能可能不可用
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const showTabBar = !location.pathname.startsWith('/schedule/detail')

  return (
    <>
      <OfflineBanner />
      <Suspense fallback={<Loading fullscreen text="加载中..." />}>
        <Routes>
          <Route path="/app" element={<ChatPage />} />
          <Route path="/app/chat" element={<ChatPage />} />
          <Route path="/app/schedule" element={<SchedulePage />} />
          <Route path="/app/schedule/detail" element={<ScheduleDetailPage />} />
        </Routes>
      </Suspense>
      {showTabBar && <TabBar />}
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
