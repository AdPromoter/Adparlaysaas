import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import CustomizationSettings from './CustomizationSettings';
import UserDashboard from './UserDashboard';
import FormBuilder from './FormBuilder';
import { FormProvider } from './FormContext';
import { FirebaseProvider } from './FirebaseContext';
import './index.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <FirebaseProvider>
        <FormProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/form-builder" element={<FormBuilder />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/settings" element={<CustomizationSettings />} />
              <Route path="/Adparlaysaas" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </FormProvider>
      </FirebaseProvider>
    </div>
  );
};

export default App;

