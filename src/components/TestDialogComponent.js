import React from 'react';
import dialog from '../lib/dialog';

const TestDialogComponent = () => {
  const showDialog = () => {
    dialog.create({
      title: "Some title",
      text: "Some text in the dialog window",
      buttons: [
        {
          text: "Download",
          variant: "default",
          onClick: (foo) => {
            console.log(foo);
            return Promise.resolve(); // Return a promise to test async handling
          }
        },
        {
          text: "Close",
          variant: "outline",
          onClick: () => {
            console.log("Close button clicked");
          }
        }
      ]
    }).open();
  };

  const showAsyncDialog = () => {
    dialog.create({
      title: "Async Example",
      text: "This dialog has an async button action",
      buttons: [
        {
          text: "Async Action",
          onClick: async (dialogRef) => {
            console.log("Starting async action...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log("Async action completed!");
          }
        },
        {
          text: "Cancel",
          onClick: () => {}
        }
      ]
    }).open()
    .then(result => {
      console.log('Dialog closed with result:', result);
    })
    .catch(error => {
      console.error('Dialog error:', error);
    });
  };

  return (
    <div className="p-4">
      <h1>Dialog Test Component</h1>
      <button 
        onClick={showDialog}
        className="mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Show Basic Dialog
      </button>
      <button 
        onClick={showAsyncDialog}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Show Async Dialog
      </button>
    </div>
  );
};

export default TestDialogComponent;