import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useGroup } from '../hooks/useGroups'

export const GroupPage = () => {
  const { id } = useParams()
  const { group, members, loading, error, addMemberByEmail } = useGroup(id)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState(null)

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    try {
      await addMemberByEmail(email)
      setEmail('')
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Loading...</p>
      </AppLayout>
    )
  }

  if (error || !group) {
    return (
      <AppLayout>
        <p className="text-destructive">{error || 'Group not found'}</p>
        <Link to="/dashboard" className="text-sm text-primary underline">
          Back to groups
        </Link>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; All groups
      </Link>
      <h2 className="text-2xl font-semibold mt-2">{group.name}</h2>
      {group.description && (
        <p className="text-muted-foreground mb-6">{group.description}</p>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_320px] mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  {m.avatar_url ? (
                    <img
                      src={m.avatar_url}
                      alt=""
                      className="size-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                </li>
              ))}
            </ul>

            <form onSubmit={handleInvite} className="flex flex-col gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Invite by email"
                required
              />
              <Button type="submit" variant="secondary" disabled={inviting || !email}>
                {inviting ? 'Adding...' : 'Add member'}
              </Button>
              {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
