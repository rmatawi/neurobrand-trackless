import dialog from '../lib/dialog';

// Custom hook for managing dialogs
export const useDialogManager = () => {
  // Just expose the dialog object directly so we have full control
  return dialog;
};