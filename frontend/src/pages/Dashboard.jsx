import { useAuthContext } from '../context/AuthContext'
import { Button } from '../components/ui/button'

export const Dashboard = () => {
  const { user, signOut } = useAuthContext()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3 px-4 py-3 sm:px-6">
          <h1 className="text-xl font-bold text-primary">Expenser</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-none">
              {user?.email}
            </span>
            <Button onClick={signOut} variant="outline" size="sm">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Your groups</h2>
          <p className="text-muted-foreground">Coming soon...</p>
        </div>
      </main>
    </div>
  )
}
