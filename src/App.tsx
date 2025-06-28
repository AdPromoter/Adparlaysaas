import React from 'react';
import { FormProvider } from './FormContext';
import Layout from './Layout';
import MultiStepForm from './MultiStepForm';

function App() {
  return (
    <FormProvider>
      <Layout>
        <MultiStepForm />
      </Layout>
    </FormProvider>
  );
}

export default App; 