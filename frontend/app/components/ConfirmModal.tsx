"use client";

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export default function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 flex flex-col">
        <div className="px-4 py-4">
          <p className="text-sm font-mono text-zinc-200">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-800">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 uppercase tracking-[0.12em] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono uppercase tracking-[0.12em] hover:bg-red-500/30 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
