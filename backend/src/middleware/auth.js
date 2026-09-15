import { supabase } from '../utils/supabaseClient.js'

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = data.user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token verification failed' })
  }
}
