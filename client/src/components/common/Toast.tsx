import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message?: string;
  type?: 'success' | 'error' | 'warning';
  duration?: number;
}

const Toast = ({ message, type = 'success', duration = 3000 }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>(type);
  
  useEffect(() => {
    if (message) {
      setToastMessage(message);
      setToastType(type);
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [message, type, duration]);
  
  // For global access to show toast
  useEffect(() => {
    // Expose a global method to show toast
    window.showToast = (msg: string, toastType: 'success' | 'error' | 'warning' = 'success') => {
      setToastMessage(msg);
      setToastType(toastType);
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    };
    
    return () => {
      // Clean up the global method
      delete window.showToast;
    };
  }, [duration]);
  
  const getToastIcon = () => {
    switch (toastType) {
      case 'success':
        return <CheckCircle className="text-success w-6 h-6" />;
      case 'error':
        return <XCircle className="text-error w-6 h-6" />;
      case 'warning':
        return <AlertCircle className="text-warning w-6 h-6" />;
      default:
        return <CheckCircle className="text-success w-6 h-6" />;
    }
  };
  
  const getToastBorderColor = () => {
    switch (toastType) {
      case 'success':
        return 'border-success';
      case 'error':
        return 'border-error';
      case 'warning':
        return 'border-warning';
      default:
        return 'border-success';
    }
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={`fixed top-4 right-4 max-w-sm p-4 bg-card border ${getToastBorderColor()} shadow-lg rounded-lg z-50`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              {getToastIcon()}
            </div>
            <div>
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
            <button 
              className="ml-auto -mx-1.5 -my-1.5 p-1.5 text-muted hover:text-primary rounded-lg"
              onClick={() => setIsVisible(false)}
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Add the global method type definition
declare global {
  interface Window {
    showToast?: (message: string, type?: 'success' | 'error' | 'warning') => void;
  }
}

export default Toast;
