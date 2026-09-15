import { useAuthContext } from '../context/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Login.css'

export const Login = () => {
  const { user, loading, signInWithGoogle } = useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>💰 Expenser</h1>
        <p>Track shared expenses with your groups</p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="google-btn"
        >
          {loading ? 'Signing in...' : '🔐 Sign in with Google'}
        </button>

        <p className="login-footer">
          Created to make group expenses simple & fair
        </p>
      </div>
    </div>
  )
}
