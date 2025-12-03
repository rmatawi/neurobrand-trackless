import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowRight, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const OnboardingTooltip = ({ 
  step, 
  totalSteps, 
  title, 
  description, 
  targetElementId,
  onNext,
  onPrev,
  onFinish,
  open,
  onOpenChange
}) => {
  if (!open) return null;

  // Calculate position based on target element
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (targetElementId) {
      const element = document.getElementById(targetElementId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      }
    }
  }, [targetElementId]);

  return (
    <div 
      className="fixed bg-white border rounded-lg shadow-lg p-4 max-w-sm z-50 transition-all"
      style={{ 
        top: position.top + 10, 
        left: position.left,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge variant="secondary" className="text-xs">
          Step {step} of {totalSteps}
        </Badge>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => {
            onOpenChange(false);
            onFinish && onFinish();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPrev}
          disabled={step <= 1}
        >
          Previous
        </Button>
        
        {step < totalSteps ? (
          <Button 
            size="sm" 
            onClick={onNext}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            size="sm" 
            onClick={() => {
              onFinish && onFinish();
              onOpenChange(false);
            }}
          >
            Get Started
          </Button>
        )}
      </div>
    </div>
  );
};

// Onboarding Manager Component
const OnboardingManager = ({ steps = [], enabled = true }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(false);

  const startOnboarding = () => {
    if (enabled && steps.length > 0) {
      setCurrentStep(0);
      setOpen(true);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const finishOnboarding = () => {
    setOpen(false);
    // Optionally save to localStorage that onboarding is complete
    localStorage.setItem('onboardingComplete', 'true');
  };

  const isOnboardingComplete = localStorage.getItem('onboardingComplete') === 'true';

  useEffect(() => {
    if (enabled && steps.length > 0 && !isOnboardingComplete) {
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000); // Show after 1 second of load

      return () => clearTimeout(timer);
    }
  }, [enabled, steps.length, isOnboardingComplete]);

  if (!enabled || steps.length === 0 || isOnboardingComplete) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <OnboardingTooltip
      step={currentStep + 1}
      totalSteps={steps.length}
      title={currentStepData.title}
      description={currentStepData.description}
      targetElementId={currentStepData.targetElementId}
      onNext={nextStep}
      onPrev={prevStep}
      onFinish={finishOnboarding}
      open={open}
      onOpenChange={setOpen}
    />
  );
};

export { OnboardingTooltip, OnboardingManager };