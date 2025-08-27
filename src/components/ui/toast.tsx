"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: "success" | "error" | "info", duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info", duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 200);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          icon: CheckCircle,
          iconColor: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
        };
      case "error":
        return {
          icon: AlertCircle,
          iconColor: "text-red-400",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
        };
      case "info":
        return {
          icon: Info,
          iconColor: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
        };
    }
  };

  const styles = getToastStyles();
  const IconComponent = styles.icon;

  return (
    <div
      className={`
        ${styles.bgColor} ${styles.borderColor} 
        border backdrop-blur-sm rounded-lg p-4 shadow-lg
        transform transition-all duration-200 ease-out
        ${isVisible 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0"
        }
        min-w-[300px] max-w-[400px]
      `}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
        <p className="text-primary-text text-sm leading-relaxed flex-1">
          {toast.message}
        </p>
        <button
          onClick={handleRemove}
          className="text-gray-400 hover:text-primary-text transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
