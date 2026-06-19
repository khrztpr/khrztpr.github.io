import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import AuthGuard from './auth/authGuard.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<AuthGuard><App /></AuthGuard>} />
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)