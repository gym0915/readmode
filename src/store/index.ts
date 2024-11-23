import { create } from 'zustand'

interface ReaderState {
  isReaderMode: boolean
  toggleReaderMode: () => void
}

export const useReaderStore = create<ReaderState>((set) => ({
  isReaderMode: false,
  toggleReaderMode: () => set((state) => ({ isReaderMode: !state.isReaderMode }))
})) 