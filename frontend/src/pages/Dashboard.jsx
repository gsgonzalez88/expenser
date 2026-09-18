import { Link } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { CreateGroupDialog } from '../components/CreateGroupDialog'
import { Card } from '../components/ui/card'
import { useGroups } from '../hooks/useGroups'

export const Dashboard = () => {
  const { groups, loading, error, createGroup } = useGroups()

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Your groups</h2>
        <CreateGroupDialog onCreate={createGroup} />
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : groups.length === 0 ? (
        <Card className="items-center text-center py-12 px-6">
          <p className="font-medium">No groups yet</p>
          <p className="text-sm text-muted-foreground">
            Create one to start tracking shared expenses.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => {
            const count = g.group_members?.[0]?.count ?? 0
            return (
              <Link key={g.id} to={`/groups/${g.id}`}>
                <Card className="px-5 h-full transition-shadow hover:shadow-md">
                  <h3 className="text-lg font-semibold">{g.name}</h3>
                  {g.description && (
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-auto">
                    {count} {count === 1 ? 'member' : 'members'}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
