import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
