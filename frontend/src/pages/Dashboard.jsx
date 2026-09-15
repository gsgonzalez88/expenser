import { useAuthContext } from '../context/AuthContext'
import '../styles/Dashboard.css'

export const Dashboard = () => {
  const { user, signOut } = useAuthContext()

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>💰 Expenser</h1>
        </div>
        <div className="header-right">
          <span>Welcome, {user?.email}</span>
          <button onClick={signOut} className="logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <h2>Your Groups</h2>
        <p>Coming soon...</p>
      </main>
    </div>
  )
}
