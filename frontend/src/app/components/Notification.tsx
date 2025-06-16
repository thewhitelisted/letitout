'use client';

import { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

export default function Notification({ message, type, isVisible, onClose }: NotificationProps) {
  // Use a state to track client-side rendering
  const [isMounted, setIsMounted] = useState(false);
    // After component mounts (client-side only), set isMounted to true
  useEffect(() => {
    setIsMounted(true);
    console.log("Notification component mounted");
  }, []);
  
  useEffect(() => {
    // Only run this effect on the client side and when visible
    if (isMounted && isVisible) {
      console.log("Notification visible:", { message, type });
      
      // Auto-close the notification after 3 seconds
      const timer = setTimeout(() => {
        console.log("Auto-closing notification after 3 seconds");
        onClose();
      }, 3000);
      
      // Clear the timeout if the component unmounts or visibility changes
      return () => clearTimeout(timer);
    }
  }, [isVisible, message, type, onClose, isMounted]);
  // Define background color based on notification type
  const bgColor = 
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    'bg-blue-600'; // info

  // Don't render anything on server or if not mounted yet
  if (!isMounted) {
    return null;
  }  return (
    <div 
      className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-[9999]
        ${bgColor} transition-all duration-500 transform 
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
      `}
      style={{ 
        maxWidth: '90vw',
        minWidth: '300px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        position: 'fixed',
        bottom: '20px',
        right: '20px'
      }}
    >
      <div className="flex items-center">
        {/* Icon based on type */}
        {type === 'success' && (
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {type === 'info' && (
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
