import React from "react";
import { Link } from "react-router-dom";

const UserDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Adparlay Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, User</span>
              <Link to="/" className="text-sm text-red-600 hover:text-red-800">
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome to Adparlay</h2>
          <p className="text-gray-600 mb-6">
            Manage your lead collection forms and track your business growth.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Create Forms</h3>
              <p className="text-blue-700 text-sm mt-1">Build custom lead collection forms</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Track Leads</h3>
              <p className="text-green-700 text-sm mt-1">Monitor and manage your leads</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900">Analytics</h3>
              <p className="text-purple-700 text-sm mt-1">View performance insights</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard; 