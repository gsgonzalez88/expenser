import { useAuthContext } from '../context/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

export const Login = () => {
  const { user, loading, signInWithGoogle } = useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-4">
      <Card className="w-full max-w-sm">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">💰 Expenser</h1>
            <p className="text-gray-600">Track shared expenses with your groups</p>
          </div>

          <Button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full py-6 text-base font-semibold"
            size="lg"
          >
            {loading ? 'Signing in...' : '🔐 Sign in with Google'}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-8">
            Created to make group expenses simple & fair
          </p>
        </div>
      </Card>
    </div>
  )
}
