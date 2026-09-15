import express from 'express'
import { supabase } from '../utils/supabaseClient.js'

const router = express.Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // This will be handled by Supabase Auth on the frontend
    res.status(200).json({ message: 'Use Supabase Auth on frontend for registration' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' })
    }

    // This will be handled by Supabase Auth on the frontend
    res.status(200).json({ message: 'Use Supabase Auth on frontend for login' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
