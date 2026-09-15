import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { supabase } from '../utils/supabaseClient.js'

const router = express.Router()

// GET /api/groups - Get all groups for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id

    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', userId)

    if (error) throw error

    const groups = data.map(gm => gm.groups)
    res.json(groups)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/groups - Create a new group
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body
    const userId = req.user.id

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' })
    }

    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert([
        {
          name,
          description,
          created_by: userId
        }
      ])
      .select()
      .single()

    if (groupError) throw groupError

    // Add creator as member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert([
        {
          group_id: group.id,
          user_id: userId
        }
      ])

    if (memberError) throw memberError

    res.status(201).json(group)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
