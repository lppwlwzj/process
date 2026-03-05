import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import useOnline from '@/hooks/useOnline'
import './styles/index.less'
import SurveyPage from '@/pages/SurveyPage'
import Loading from '@/components/Loading'
import ErrorBoundary from '@/components/ErrorBoundary'

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
  return (
    <>
      <OfflineBanner />
      <Suspense fallback={<Loading fullscreen text="加载中..." />}>
        <Routes>
          <Route path="/survey" element={<SurveyPage />} />
        </Routes>
      </Suspense>
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
