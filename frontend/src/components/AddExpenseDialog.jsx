import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { useCategories } from '../hooks/useExpenses'

const today = () => new Date().toLocaleDateString('en-CA')

export const AddExpenseDialog = ({ members, currentUserId, onCreate }) => {
  const { categories } = useCategories()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [expenseDate, setExpenseDate] = useState(today)
  const [participantIds, setParticipantIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setParticipantIds(members.map((m) => m.id))
  }, [members])

  const subcategories =
    categories.find((c) => c.id === categoryId)?.subcategories ?? []

  const parsedAmount = Number.parseFloat(amount)
  const splitPreview =
    Number.isFinite(parsedAmount) && parsedAmount > 0 && participantIds.length > 0
      ? (parsedAmount / participantIds.length).toFixed(2)
      : null

  const toggleParticipant = (id) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const reset = () => {
    setDescription('')
    setAmount('')
    setCategoryId('')
    setSubcategoryId('')
    setExpenseDate(today())
    setParticipantIds(members.map((m) => m.id))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onCreate({
        description: description.trim(),
        amount: parsedAmount,
        categoryId,
        subcategoryId,
        expenseDate,
        participantIds,
      })
      reset()
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const canSubmit =
    description.trim() &&
    parsedAmount > 0 &&
    categoryId &&
    participantIds.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Add expense</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add an expense</DialogTitle>
            <DialogDescription>
              Split it equally between the people you pick.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Supermercado, Uber al aeropuerto..."
                maxLength={255}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="expense-amount">Amount</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="expense-category">Category</Label>
                <Select
                  id="expense-category"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value)
                    setSubcategoryId('')
                  }}
                  required
                >
                  <option value="">Pick one</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expense-subcategory">Subcategory</Label>
                <Select
                  id="expense-subcategory"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={subcategories.length === 0}
                >
                  <option value="">None</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Split between</Label>
              <div className="flex flex-col gap-1.5 rounded-lg border border-input p-2.5">
                {members.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={participantIds.includes(m.id)}
                      onChange={() => toggleParticipant(m.id)}
                    />
                    <span>{m.id === currentUserId ? 'You' : m.name}</span>
                  </label>
                ))}
              </div>
              {splitPreview && (
                <p className="text-xs text-muted-foreground">
                  ${splitPreview} each ({participantIds.length}{' '}
                  {participantIds.length === 1 ? 'person' : 'people'})
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !canSubmit}>
              {saving ? 'Adding...' : 'Add expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
