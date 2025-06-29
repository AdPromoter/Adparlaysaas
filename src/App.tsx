import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FirebaseProvider } from './FirebaseContext';
import { FormProvider } from './FormContext';
import Layout from './Layout';
import MultiStepForm from './MultiStepForm';
import AdminLogin from './AdminLogin';
import './index.css';

function App() {
  return (
    <FirebaseProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public form route */}
            <Route 
              path="/" 
              element={
                <FormProvider>
                  <Layout>
                    <MultiStepForm />
                  </Layout>
                </FormProvider>
              } 
            />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLogin />} />
            
            {/* Catch all route */}
            <Route 
              path="*" 
              element={
                <FormProvider>
                  <Layout>
                    <MultiStepForm />
                  </Layout>
                </FormProvider>
              } 
            />
          </Routes>
        </div>
      </Router>
    </FirebaseProvider>
  );
}

export default App; 