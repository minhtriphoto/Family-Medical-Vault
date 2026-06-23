import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Xác nhận xóa', cancelText = 'Hủy' }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl relative z-10"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                 <AlertTriangle className="w-6 h-6" />
                 <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{title}</h3>
              </div>
              <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">{message}</p>
            <div className="flex justify-end gap-3 font-medium">
               <button onClick={onCancel} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-sm">
                  {cancelText}
               </button>
               <button onClick={() => { onConfirm(); onCancel(); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors text-sm shadow-md flex items-center gap-2">
                  {confirmText}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
