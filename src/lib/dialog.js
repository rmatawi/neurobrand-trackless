import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { createRoot } from 'react-dom/client';

// Dialog instance factory function
function createDialogInstance(props) {
  let open = false;
  let resolvePromise = null;
  let rejectPromise = null;
  let promise = null;
  let dialogDiv = null;
  let root = null;

  // Method to close the dialog
  const close = () => {
    open = false;
    if (root) {
      root.unmount();
      root = null;
    }
    if (dialogDiv) {
      document.body.removeChild(dialogDiv);
      dialogDiv = null;
    }
  };

  // Create a reference to pass to onClick handlers
  const dialogRef = {
    close
  };

  // Method to handle button click and resolve promise
  const handleButtonClick = (buttonIndex) => {
    const button = props.buttons[buttonIndex];
    if (button.onClick) {
      // If onClick returns a promise, wait for it before closing
      const result = button.onClick(dialogRef); // Pass the dialog reference
      if (result instanceof Promise) {
        result.then(() => {
          close();
          if (resolvePromise) {
            resolvePromise({ buttonIndex, button });
          }
        }).catch((error) => {
          close();
          if (rejectPromise) {
            rejectPromise(error);
          }
        });
      } else {
        close();
        if (resolvePromise) {
          resolvePromise({ buttonIndex, button });
        }
      }
    } else {
      close();
      if (resolvePromise) {
        resolvePromise({ buttonIndex, button });
      }
    }
  };

  // Render the dialog using React
  const renderDialog = () => {
    // Create a temporary div to render the dialog into
    dialogDiv = document.createElement('div');
    document.body.appendChild(dialogDiv);

    // Create the dialog component
    const DialogComponent = () => {
      const [isOpen, setIsOpen] = useState(open);

      // Handle initial open state
      useEffect(() => {
        setIsOpen(true);
      }, []);

      useEffect(() => {
        // When the dialog closes, clean up
        if (!isOpen) {
          setTimeout(() => {
            close();
          }, 0);
        }
      }, [isOpen]);

      return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              {props.title && (
                <DialogTitle>{props.title}</DialogTitle>
              )}
            </DialogHeader>
            {props.text && (
              <DialogDescription className="pb-4">
                {props.text}
              </DialogDescription>
            )}
            {props.children && (
              <div className="pb-4">
                {props.children}
              </div>
            )}
            <DialogFooter className="flex flex-row gap-2">
              {props.buttons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.variant || "default"}
                  onClick={() => handleButtonClick(index)}
                >
                  {button.text}
                </Button>
              ))}
            </DialogFooter>
          </DialogContent>
        </DialogPrimitive.Root>
      );
    };

    // Render the component using createRoot
    root = createRoot(dialogDiv);
    root.render(<DialogComponent />);
  };

  // Method to open the dialog and return a promise
  const openDialog = () => {
    open = true;

    // Create a promise that resolves when the dialog is closed
    promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    // Render the dialog component
    renderDialog();

    return promise;
  };

  return {
    open: openDialog
  };
}

// Main dialog utility object
const dialog = {
  create(props) {
    const instance = createDialogInstance(props);
    console.log('Dialog instance created:', instance);
    console.log('Has open method:', typeof instance.open === 'function');
    return instance;
  }
};

export default dialog;