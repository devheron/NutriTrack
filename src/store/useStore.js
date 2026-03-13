import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Placeholder image for products without photo
export const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23111820"/><text x="60" y="68" text-anchor="middle" font-size="40" fill="%23223">📦</text></svg>'

export const CATEGORIES = [
  { id: 'all',        label: 'Todos',      color: '#F0F4F8' },
  { id: 'mercado',    label: 'Mercado',    color: '#00D4AA' },
  { id: 'farmacia',   label: 'Farmácia',   color: '#0099FF' },
  { id: 'suplemento', label: 'Suplemento', color: '#FF4B8B' },
  { id: 'proteina',   label: 'Proteína',   color: '#FF6B35' },
  { id: 'graos',      label: 'Grãos',      color: '#F5C842' },
]

export const MEALS = [
  'Café da manhã', 'Almoço', 'Lanche da tarde',
  'Jantar', 'Pré-treino', 'Pós-treino',
]

// Banco de alimentos com dados realistas
const SAMPLE_ITEMS = [
  {
    id: 1, name: 'Aveia em Flocos Finos', brand: 'Quaker',
    category: 'graos', store: 'Mercado',
    calories: 361, protein: 13.9, carbs: 58.7, fat: 7.0,
    serving: 100, unit: 'g', price: 9.5,
    photo: null,
    description: 'Rica em fibras e proteínas, ideal para café da manhã',
  },
  {
    id: 2, name: 'Whey Protein Concentrado', brand: 'Growth Supplements',
    category: 'suplemento', store: 'Farmácia',
    calories: 133, protein: 24.0, carbs: 5.8, fat: 2.1,
    serving: 35, unit: 'g', price: 149.9,
    photo: null,
    description: 'Proteína de rápida absorção para pós-treino',
  },
  {
    id: 3, name: 'Peito de Frango Grelhado', brand: 'Sadia',
    category: 'proteina', store: 'Mercado',
    calories: 165, protein: 31.0, carbs: 0, fat: 3.6,
    serving: 100, unit: 'g', price: 22.9,
    photo: null,
    description: 'Proteína magra, baixo teor de gordura',
  },
  {
    id: 4, name: 'Ovo Inteiro Caipira', brand: 'Orgânico',
    category: 'proteina', store: 'Mercado',
    calories: 155, protein: 13.0, carbs: 1.1, fat: 11.0,
    serving: 50, unit: 'un', price: 1.8,
    photo: null,
    description: 'Fonte completa de aminoácidos essenciais',
  },
  {
    id: 5, name: 'Atum em Lata ao Natural', brand: 'Gomes da Costa',
    category: 'proteina', store: 'Mercado',
    calories: 127, protein: 28.0, carbs: 0, fat: 1.3,
    serving: 170, unit: 'g', price: 8.9,
    photo: null,
    description: 'Alto teor proteico, praticidade no dia a dia',
  },
  {
    id: 6, name: 'Granola Tradicional', brand: 'Jasmine',
    category: 'graos', store: 'Mercado',
    calories: 387, protein: 10.2, carbs: 65.0, fat: 10.0,
    serving: 100, unit: 'g', price: 18.9,
    photo: null,
    description: 'Mistura de cereais integrais com frutas secas',
  },
  {
    id: 7, name: 'Amendoim Torrado Sem Sal', brand: 'Dr. Amendoim',
    category: 'graos', store: 'Mercado',
    calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2,
    serving: 100, unit: 'g', price: 14.9,
    photo: null,
    description: 'Rico em proteínas vegetais e gorduras boas',
  },
  {
    id: 8, name: 'Creatina Monohidratada', brand: 'Integral Médica',
    category: 'suplemento', store: 'Farmácia',
    calories: 0, protein: 0, carbs: 0, fat: 0,
    serving: 5, unit: 'g', price: 59.9,
    photo: null,
    description: 'Aumento de força e performance muscular',
  },
  {
    id: 9, name: 'Iogurte Grego Natural', brand: 'Fage',
    category: 'proteina', store: 'Mercado',
    calories: 97, protein: 9.0, carbs: 4.0, fat: 5.0,
    serving: 170, unit: 'g', price: 11.9,
    photo: null,
    description: 'Probióticos e proteína em textura cremosa',
  },
  {
    id: 10, name: 'Cottage Cheese', brand: 'Vigor',
    category: 'proteina', store: 'Mercado',
    calories: 98, protein: 11.1, carbs: 3.4, fat: 4.5,
    serving: 100, unit: 'g', price: 9.9,
    photo: null,
    description: 'Queijo de baixa caloria, alto em proteína',
  },
]

const today = () => new Date().toISOString().split('T')[0]

export const useStore = create(
  persist(
    (set, get) => ({

      // ── ITEMS ────────────────────────────────────
      items: SAMPLE_ITEMS,

      addItem: (item) => set((s) => ({
        items: [...s.items, { ...item, id: Date.now() }]
      })),
      updateItem: (id, data) => set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i))
      })),
      deleteItem: (id) => set((s) => ({
        items: s.items.filter((i) => i.id !== id)
      })),

      // ── GOALS ────────────────────────────────────
      goals: { calories: 2500, protein: 150 },
      setGoals: (g) => set({ goals: g }),

      // ── DAILY LOGS ───────────────────────────────
      dailyLogs: {},

      addLog: (date, entry) => set((s) => ({
        dailyLogs: {
          ...s.dailyLogs,
          [date]: [...(s.dailyLogs[date] || []), { ...entry, id: Date.now() }],
        },
      })),

      removeLog: (date, logId) => set((s) => ({
        dailyLogs: {
          ...s.dailyLogs,
          [date]: (s.dailyLogs[date] || []).filter((l) => l.id !== logId),
        },
      })),

      // ── SCHEDULED ────────────────────────────────
      scheduledPlans: {},
      scheduleDay: (date, plan) => set((s) => ({
        scheduledPlans: { ...s.scheduledPlans, [date]: plan }
      })),
      removeSchedule: (date) => set((s) => {
        const { [date]: _, ...rest } = s.scheduledPlans
        return { scheduledPlans: rest }
      }),

      // ── COMPUTED ─────────────────────────────────
      getLogsForDate: (date) => {
        const { dailyLogs, items } = get()
        return (dailyLogs[date] || []).map((log) => {
          const item = items.find((i) => i.id === log.itemId)
          if (!item) return null
          const r = log.quantity / item.serving
          return {
            ...log, item,
            totalCalories: Math.round(item.calories * r),
            totalProtein:  +(item.protein * r).toFixed(1),
            totalCarbs:    +(item.carbs   * r).toFixed(1),
            totalFat:      +(item.fat     * r).toFixed(1),
          }
        }).filter(Boolean)
      },

      getDaySummary: (date) => {
        const logs = get().getLogsForDate(date)
        return logs.reduce(
          (acc, l) => ({
            calories: acc.calories + l.totalCalories,
            protein:  +(acc.protein + l.totalProtein).toFixed(1),
            carbs:    +(acc.carbs   + l.totalCarbs).toFixed(1),
            fat:      +(acc.fat     + l.totalFat).toFixed(1),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        )
      },
    }),
    { name: 'nutritrack-v2', version: 1 }
  )
)
