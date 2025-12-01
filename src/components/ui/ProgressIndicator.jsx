import React from 'react';
import { cn } from '../../lib/utils';

const ProgressIndicator = ({ 
  currentStep, 
  totalSteps, 
  labels = ['Template', 'Sequence', 'Render'], 
  className 
}) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center justify-center mb-6", className)}>
      <div className="flex items-center w-full max-w-2xl">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  currentStep >= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-border"
                )}
              >
                {step}
              </div>
              <span className="mt-2 text-xs text-center font-medium max-w-[80px]">
                {labels[index] || `Step ${step}`}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-full flex-1 mx-2",
                  currentStep > step ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;