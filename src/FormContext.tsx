import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  description: string;
}

interface FormContextType {
  step: number;
  formData: FormData;
  updateForm: (data: Partial<FormData>) => void;
  nextStep: () => void;
  resetForm: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

interface FormProviderProps {
  children: ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    interest: '',
    description: '',
  });

  const updateForm = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 4));
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      email: '',
      phone: '',
      interest: '',
      description: '',
    });
  };

  return (
    <FormContext.Provider value={{ step, formData, updateForm, nextStep, resetForm }}>
      {children}
    </FormContext.Provider>
  );
}; 