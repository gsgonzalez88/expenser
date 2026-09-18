import { useAuthContext } from '../context/AuthContext'
import { Button } from '../components/ui/button'

export const Dashboard = () => {
  const { user, signOut } = useAuthContext()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex justify-between items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">💰 Expenser</h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            <Button
              onClick={signOut}
              variant="destructive"
              size="sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Groups</h2>
          <p className="text-gray-600">Coming soon...</p>
        </div>
      </main>
    </div>
  )
}
