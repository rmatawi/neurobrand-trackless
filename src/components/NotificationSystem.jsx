import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

const NotificationSystem = () => {
  // This component serves as the notification provider
  return <Toaster position="top-right" expand={true} richColors />;
};

// Custom notification functions
export const showNotification = {
  success: (message, options = {}) => {
    toast.success(message, {
      icon: <CheckCircle className="w-5 h-5" />,
      ...options
    });
  },
  error: (message, options = {}) => {
    toast.error(message, {
      icon: <XCircle className="w-5 h-5" />,
      ...options
    });
  },
  warning: (message, options = {}) => {
    toast.warning(message, {
      icon: <AlertCircle className="w-5 h-5" />,
      ...options
    });
  },
  info: (message, options = {}) => {
    toast.info(message, {
      icon: <Info className="w-5 h-5" />,
      ...options
    });
  }
};

export default NotificationSystem;