interface ToastItem {
  id: string;
  message: string;
  type: 'error' | 'info' | 'success';
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const TYPE_CLASSES = {
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white',
  success: 'bg-green-600 text-white',
};

export default function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      onClick={onDismiss}
      className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-lg pointer-events-auto cursor-pointer animate-bounce-in ${TYPE_CLASSES[toast.type]}`}
    >
      {toast.message}
    </div>
  );
}
