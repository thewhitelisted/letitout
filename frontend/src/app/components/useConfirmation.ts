import { useState, useCallback } from 'react';

interface UseConfirmationProps {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onCancel?: () => void;
}

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading: boolean;
}

export function useConfirmation() {  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: () => {},
    onCancel: undefined,
    isLoading: false
  });

  const showConfirmation = useCallback((
    onConfirm: () => void,
    options: UseConfirmationProps = {}
  ) => {    setConfirmation({
      isOpen: true,
      title: options.title || 'Confirm Action',
      message: options.message || 'Are you sure you want to proceed?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'danger',
      onConfirm,
      onCancel: options.onCancel,
      isLoading: false
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  }, []);
  const setLoading = useCallback((loading: boolean) => {
    setConfirmation(prev => ({ ...prev, isLoading: loading }));
  }, []);  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await confirmation.onConfirm();
      hideConfirmation();
    } catch {
      setLoading(false);
      // Don't hide the modal if there's an error, let the caller handle it
    }
  }, [confirmation, hideConfirmation, setLoading]);
  const handleCancel = useCallback(() => {
    if (confirmation.onCancel) {
      confirmation.onCancel();
    }
    hideConfirmation();
  }, [confirmation.onCancel, hideConfirmation]);
  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    handleCancel,
    setLoading
  };
}
