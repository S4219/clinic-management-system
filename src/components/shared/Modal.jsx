import { X } from 'lucide-react'

export function ModalShell({ title, subtitle, onClose, size = 'md', children }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[92vh] flex flex-col`}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>
    </div>
  )
}

export function ModalActions({ onClose, loading, submitLabel = 'Save', danger = false }) {
  return (
    <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
      <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className={danger ? 'btn-danger' : 'btn-primary'}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {loading ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}
