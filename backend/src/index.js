import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Routes
// app.use('/api/auth', authRoutes)
// app.use('/api/groups', groupRoutes)
// app.use('/api/expenses', expenseRoutes)

app.listen(PORT, () => {
  console.log(`✨ Server running on http://localhost:${PORT}`)
})
