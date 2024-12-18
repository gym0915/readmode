import { create } from 'zustand'

interface ReaderState {
  isReaderMode: boolean
  isSummaryVisible: boolean
  toggleReaderMode: () => void
  toggleSummary: () => void
}

export const useReaderStore = create<ReaderState>((set) => ({
  isReaderMode: false,
  isSummaryVisible: false,
  toggleReaderMode: () => set((state) => ({ isReaderMode: !state.isReaderMode })),
  toggleSummary: () => set((state) => ({ isSummaryVisible: !state.isSummaryVisible }))
})) 