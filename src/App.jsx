import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { DemoProvider } from './context/DemoContext'
import { supabase, requireAdminAuth } from './lib/supabase'
import { DashboardLayout } from './components/layout/Layouts'
import PresenterBar from './components/layout/PresenterBar'
import LandingPage from './pages/LandingPage'
import TouristDemoPage from './pages/TouristDemoPage'
import HotelDashboardPage from './pages/HotelDashboardPage'
import OperationsDashboardPage from './pages/OperationsDashboardPage'
import IncidentManagementPage from './pages/IncidentManagementPage'
import DriverManagementPage from './pages/DriverManagementPage'
import ScamInsightsPage from './pages/ScamInsightsPage'
import JourneyTrackingPage from './pages/JourneyTrackingPage'
import AdminLoginPage from './pages/AdminLoginPage'
import PrivacyPage from './pages/PrivacyPage'
import NotFoundPage from './pages/NotFoundPage'

/** Gate dashboards behind Supabase Auth only when VITE_REQUIRE_ADMIN_AUTH=true. */
function RequireAuth({ children }) {
  const [session, setSession] = useState(undefined)
  const location = useLocation()
  useEffect(() => {
    if (!requireAdminAuth) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (!requireAdminAuth) return children
  if (session === undefined) return null
  return session ? children : <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const showPresenter = !pathname.startsWith('/journey/') && pathname !== '/admin/login'
  return (
    <DemoProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<TouristDemoPage />} />
        <Route path="/journey/:id" element={<JourneyTrackingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
          <Route path="/hotel" element={<HotelDashboardPage />} />
          <Route path="/operations" element={<OperationsDashboardPage />} />
          <Route path="/operations/incidents" element={<IncidentManagementPage />} />
          <Route path="/operations/drivers" element={<DriverManagementPage />} />
          <Route path="/operations/scams" element={<ScamInsightsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {showPresenter && <PresenterBar />}
      <Toaster position="top-right" richColors closeButton />
    </DemoProvider>
  )
}
