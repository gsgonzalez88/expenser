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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-80 aspect-square shadow-lg justify-center">
        <div className="px-8 flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Expenser</h1>
          <p className="text-muted-foreground mb-10">
            Track shared expenses with your groups
          </p>

          <Button
            onClick={signInWithGoogle}
            disabled={loading}
            className="h-14 px-8 text-base"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          <p className="text-xs text-muted-foreground mt-10">
            Simple & fair group expenses
          </p>
        </div>
      </Card>
    </div>
  )
}
