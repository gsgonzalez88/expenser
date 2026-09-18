import { Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { Button } from './ui/button'

export const AppLayout = ({ children }) => {
  const { user, signOut } = useAuthContext()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/dashboard" className="text-xl font-bold text-primary">
            Expenser
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button onClick={signOut} variant="outline" size="sm">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
