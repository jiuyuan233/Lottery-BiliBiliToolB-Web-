import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import DashboardPage from './pages/DashboardPage'
import ConfigPage from './pages/ConfigPage'
import LogsPage from './pages/LogsPage'
import QuickStartPage from './pages/QuickStartPage'
import QrLoginPage from './pages/QrLoginPage'
import SmsLoginPage from './pages/SmsLoginPage'
import BiliToolPage from './pages/BiliToolPage'

export default function App() {
  return (
    <div className="min-h-screen bg-lottery-dark text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/quickstart" element={<QuickStartPage />} />
          <Route path="/login" element={<QrLoginPage />} />
          <Route path="/login/sms" element={<SmsLoginPage />} />
          <Route path="/bili-tool" element={<BiliToolPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
