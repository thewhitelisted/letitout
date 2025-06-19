'use client';

import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;  const variantStyles = {    danger: {
      confirmButton: 'bg-black hover:bg-gray-800 focus:ring-gray-500',
      iconBackground: 'bg-white border border-black',
      icon: '⚠'
    },warning: {
      confirmButton: 'bg-black hover:bg-gray-800 focus:ring-gray-500',
      iconBackground: 'bg-white border border-black',
      icon: '⚠'
    },
    info: {
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      iconBackground: 'bg-blue-100',
      icon: 'ℹ️'
    }
  };

  const styles = variantStyles[variant];  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 transition-opacity duration-300 ease-out"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 300ms ease-out'
        }}
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all duration-300 ease-out sm:w-full sm:max-w-lg"
          style={{
            animation: 'slideInUp 300ms ease-out'
          }}
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBackground} sm:mx-0 sm:h-10 sm:w-10`}>
                <span className="text-xl text-black" style={{ transform: 'translateY(-1.5px)' }}>{styles.icon}</span>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className={`inline-flex w-full justify-center items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${styles.confirmButton} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {confirmText}
            </button>            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
