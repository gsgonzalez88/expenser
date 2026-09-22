import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useExpenses = (groupId) => {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select(
        `id, description, amount, currency, expense_date, created_at,
         payer:users(id, name, avatar_url),
         category:categories(id, name, icon),
         subcategory:subcategories(id, name),
         participants:expense_participants(user_id, share)`
      )
      .eq('group_id', groupId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setExpenses(data)
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const createExpense = async ({
    description,
    amount,
    categoryId,
    subcategoryId,
    expenseDate,
    participantIds,
  }) => {
    const { data, error } = await supabase.rpc('create_expense', {
      p_group_id: groupId,
      p_description: description,
      p_amount: amount,
      p_category_id: categoryId,
      p_participant_ids: participantIds,
      p_subcategory_id: subcategoryId || null,
      p_expense_date: expenseDate || null,
    })
    if (error) throw new Error(error.message)
    await fetchExpenses()
    return data
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return { expenses, total, loading, error, createExpense, refetch: fetchExpenses }
}

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, subcategories(id, name)')
        .order('name')
        .order('name', { referencedTable: 'subcategories' })
      if (error) setError(error.message)
      else setCategories(data)
    }
    fetchCategories()
  }, [])

  return { categories, error }
}
