import { useState, useEffect } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import ChatInterface from './components/ChatInterface'
import api from './api'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('loading') // Start with loading
  const [user, setUser] = useState(null)

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = () => {
      const token = api.utils.getAuthToken()
      const savedUser = localStorage.getItem('user')
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setUser(userData)
          setCurrentView('chat')
        } catch (error) {
          // Invalid saved data, clear and show login
          api.utils.clearAuthData()
          localStorage.removeItem('user')
          setCurrentView('login')
        }
      } else {
        setCurrentView('login')
      }
    }
    
    checkExistingSession()
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData)) // Save user data
    setCurrentView('chat')
  }

  const handleRegister = () => {
    // After successful registration, redirect to login page
    setCurrentView('login')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user') // Clear saved user data
    setCurrentView('login')
  }

  const switchToRegister = () => setCurrentView('register')
  const switchToLogin = () => setCurrentView('login')

  // Show loading state while checking session
  if (currentView === 'loading') {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1.2rem',
          color: '#667eea'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {currentView === 'login' && (
        <Login 
          onLogin={handleLogin} 
          onSwitchToRegister={switchToRegister}
        />
      )}
      {currentView === 'register' && (
        <Register 
          onRegister={handleRegister} 
          onSwitchToLogin={switchToLogin}
        />
      )}
      {currentView === 'chat' && (
        <ChatInterface 
          user={user} 
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App
