import { create } from 'zustand';

export interface Toast {
  id: number;
  tone: 'success' | 'error';
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: Toast['tone']) => void;
  dismiss: (id: number) => void;
}

let seq = 0;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, tone, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), tone === 'error' ? 6000 : 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message: string, tone?: Toast['tone']) => useToasts.getState().push(message, tone);
