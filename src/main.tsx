import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { TracePage } from './pages/TracePage'
import './index.css'
const traceMatch = window.location.pathname.match(/^\/trace\/(.+)$/)
const entry = traceMatch ? <TracePage lotId={decodeURIComponent(traceMatch[1])} transactionId={new URLSearchParams(window.location.search).get('transaction')} /> : <App />
createRoot(document.getElementById('root')!).render(<StrictMode>{entry}</StrictMode>)
