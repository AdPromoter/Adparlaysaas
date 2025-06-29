import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import CustomizationSettings from './CustomizationSettings';
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
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/settings" element={<CustomizationSettings />} />
            </Routes>
          </Router>
        </FormProvider>
      </FirebaseProvider>
    </div>
  );
};

export default App;

