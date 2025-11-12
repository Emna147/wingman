"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface Toast {
  title: string;
  description?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  isClosable?: boolean;
}

interface ToastContextType {
  (props: Toast): void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const showToast = (props: Toast) => {
    // Create and show a toast notification
    const toastEl = document.createElement('div');
    toastEl.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      props.status === 'error'
        ? 'bg-red-500'
        : props.status === 'success'
        ? 'bg-green-500'
        : props.status === 'warning'
        ? 'bg-yellow-500'
        : 'bg-blue-500'
    } text-white z-50 transform transition-all duration-300 ease-in-out`;

    const content = `
      <div class="flex flex-col gap-1">
        <h3 class="font-semibold">${props.title}</h3>
        ${props.description ? `<p class="text-sm">${props.description}</p>` : ''}
      </div>
    `;

    toastEl.innerHTML = content;
    document.body.appendChild(toastEl);

    // Animation
    requestAnimationFrame(() => {
      toastEl.style.opacity = '1';
      toastEl.style.transform = 'translateY(0)';
    });

    // Auto remove after duration
    setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateY(100%)';
      setTimeout(() => {
        document.body.removeChild(toastEl);
      }, 300);
    }, props.duration || 3000);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};