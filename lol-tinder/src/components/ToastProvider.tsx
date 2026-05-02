'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertCircle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface ToastAction { label: string; onClick: () => void }
interface Toast { message: string; type: ToastType; action?: ToastAction }
interface ToastContextType { showToast: (message: string, type?: ToastType, action?: ToastAction, duration?: number) => void }

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'success', action?: ToastAction, duration: number = 4000) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type, action })
    timerRef.current = setTimeout(() => setToast(null), duration)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
            className="fixed top-8 right-6 z-[120] modern-panel px-6 py-4 flex items-center gap-4 min-w-[300px] max-w-[420px] border-[rgb(var(--accent-color)/0.5)] bg-[rgb(var(--bg-secondary)/0.9)] backdrop-blur-xl shadow-2xl shadow-[rgb(var(--accent-color)/0.2)]"
          >
            <div className={`p-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' 
              : toast.type === 'info' ? 'bg-blue-500/20 text-blue-400'
              : 'bg-[rgb(var(--accent-color)/0.2)] text-[rgb(var(--accent-color))]'
            }`}>
              {toast.type === 'success' ? <Check size={18} /> : toast.type === 'info' ? <Info size={18} /> : <AlertCircle size={18} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white tracking-tight leading-none">{toast.message}</p>
            </div>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
                className="toast-action-btn flex items-center h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[1.5px] transition-all duration-200 border whitespace-nowrap"
                style={{
                  borderColor: 'rgba(var(--accent-color), 0.4)',
                  color: 'rgb(var(--accent-color))',
                  '--toast-accent': 'rgb(var(--accent-color))',
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  btn.style.background = 'rgb(var(--accent-color))';
                  btn.style.borderColor = 'rgb(var(--accent-color))';
                  btn.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.background = '';
                  btn.style.borderColor = 'rgba(var(--accent-color), 0.4)';
                  btn.style.color = 'rgb(var(--accent-color))';
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}