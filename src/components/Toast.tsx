import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '../hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  const { id, message, type, duration } = toast;

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className={`flex items-center p-4 rounded-lg border shadow-lg ${getBackgroundColor()} animate-slide-in`}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className={`ml-3 flex-1 ${getTextColor()}`}>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className={`ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default Toast;