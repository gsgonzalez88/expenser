import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { supabase } from '../utils/supabaseClient.js'

const router = express.Router()

// GET /api/expenses/group/:groupId - Get expenses for a group
router.get('/group/:groupId', verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params
    const userId = req.user.id

    // Verify user is member of group
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' })
    }

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        paid_by_user:paid_by(id, name, email),
        category:category_id(id, name, icon),
        subcategory:subcategory_id(id, name),
        participants:expense_participants(user_id, share)
      `)
      .eq('group_id', groupId)
      .order('expense_date', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/expenses - Create an expense
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const {
      groupId,
      description,
      amount,
      categoryId,
      subcategoryId,
      expenseDate,
      participants
    } = req.body

    if (!groupId || !description || !amount || !categoryId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Create expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([
        {
          group_id: groupId,
          paid_by: userId,
          description,
          amount,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          expense_date: expenseDate || new Date().toISOString().split('T')[0],
          currency: 'USD'
        }
      ])
      .select()
      .single()

    if (expenseError) throw expenseError

    // Add participants
    if (participants && participants.length > 0) {
      const { error: participantsError } = await supabase
        .from('expense_participants')
        .insert(
          participants.map(p => ({
            expense_id: expense.id,
            user_id: p.userId,
            share: p.share
          }))
        )

      if (participantsError) throw participantsError
    }

    // Update suggestions
    const { error: suggestionError } = await supabase
      .from('expense_suggestions')
      .upsert([
        {
          user_id: userId,
          group_id: groupId,
          description,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          usage_count: 1,
          last_used: new Date().toISOString()
        }
      ], {
        onConflict: 'user_id,group_id,description,category_id'
      })

    if (suggestionError) console.log('Suggestion update failed:', suggestionError)

    res.status(201).json(expense)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
