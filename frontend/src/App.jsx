import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Research from './pages/Research'
import Markets from './pages/Markets'
import MarketIntelligence from './pages/MarketIntelligence'
import QuantTools from './pages/QuantTools'
import MacroFed from './pages/MacroFed'
import AfricanMarkets from './pages/AfricanMarkets'
import Reports from './pages/Reports'

export default function App() {
  return (
    <AppProvider>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="research" element={<Research />} />
        <Route path="markets" element={<Markets />} />
        <Route path="market-intelligence" element={<MarketIntelligence />} />
        <Route path="quant" element={<QuantTools />} />
        <Route path="macro" element={<MacroFed />} />
        <Route path="african" element={<AfricanMarkets />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
    </AppProvider>
  )
}
