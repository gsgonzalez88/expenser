import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useGroups = () => {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, description, created_at, group_members(count)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setGroups(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const createGroup = async ({ name, description }) => {
    const { data, error } = await supabase.rpc('create_group', {
      p_name: name,
      p_description: description || null,
    })
    if (error) throw new Error(error.message)
    await fetchGroups()
    return data
  }

  return { groups, loading, error, createGroup, refetch: fetchGroups }
}

export const useGroup = (groupId) => {
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGroup = useCallback(async () => {
    setLoading(true)
    const [groupRes, membersRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase
        .from('group_members')
        .select('joined_at, user:users(id, name, email, avatar_url)')
        .eq('group_id', groupId)
        .order('joined_at'),
    ])
    if (groupRes.error) setError(groupRes.error.message)
    else setGroup(groupRes.data)
    if (membersRes.error) setError(membersRes.error.message)
    else setMembers(membersRes.data.map((m) => ({ ...m.user, joined_at: m.joined_at })))
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    fetchGroup()
  }, [fetchGroup])

  const addMemberByEmail = async (email) => {
    const { data, error } = await supabase.rpc('add_group_member_by_email', {
      p_group_id: groupId,
      p_email: email.trim(),
    })
    if (error) throw new Error(error.message)
    await fetchGroup()
    return data
  }

  return { group, members, loading, error, addMemberByEmail, refetch: fetchGroup }
}
