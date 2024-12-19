import { create } from 'zustand'

interface ReaderState {
  isReaderMode: boolean
  isSummaryVisible: boolean
  isToolbarVisible: boolean
  toggleReaderMode: () => void
  toggleSummary: () => void
  setToolbarVisible: (visible: boolean) => void
}

export const useReaderStore = create<ReaderState>((set) => ({
  isReaderMode: false,
  isSummaryVisible: false,
  isToolbarVisible: true,
  toggleReaderMode: () => set((state) => ({ isReaderMode: !state.isReaderMode })),
  toggleSummary: () => set((state) => ({ 
    isSummaryVisible: !state.isSummaryVisible,
    isToolbarVisible: false // 打开summary时直接隐藏toolbar
  })),
  setToolbarVisible: (visible) => set({ isToolbarVisible: visible })
})) 