import { create } from 'zustand'
import { Schedule, ScheduleFilter } from '@/types/schedule'

interface ScheduleStoreState {
  scheduleList: Schedule[]
  selectedDate: string | null
  filter: ScheduleFilter
  loading: boolean
  error: string | null
  setScheduleList: (schedules: Schedule[]) => void
  addSchedule: (schedule: Schedule) => void
  setSelectedDate: (date: string | null) => void
  setFilter: (filter: Partial<ScheduleFilter>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useScheduleStore = create<ScheduleStoreState>((set) => ({
  scheduleList: [],
  selectedDate: null,
  filter: {},
  loading: false,
  error: null,
  setScheduleList: (schedules) => set({ scheduleList: schedules }),
  addSchedule: (schedule) =>
    set((state) => ({ scheduleList: [...state.scheduleList, schedule] })),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setFilter: (filter) =>
    set((state) => ({ filter: { ...state.filter, ...filter } })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}))
