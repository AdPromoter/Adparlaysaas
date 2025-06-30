import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const [forms, setForms] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('forms');
    setForms(stored ? JSON.parse(stored) : []);
    
    const storedSubmissions = localStorage.getItem('form_submissions');
    setSubmissions(storedSubmissions ? JSON.parse(storedSubmissions) : []);
  }, [activeTab]);

  const handleCreateForm = () => {
    navigate('/form-builder');
  };

  const getFormTitle = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    return form ? form.title : 'Unknown Form';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background p-4 font-sans">
      <header className="bg-panel shadow-md border-b border-border rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-extrabold text-heading tracking-tight">Adparlay Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-base text-muted">Welcome, User</span>
              <Link to="/" className="text-base text-error font-semibold bg-error/10 px-3 py-1 rounded-xl transition-colors shadow-sm border border-error">Sign Out</Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">Total Forms</p>
                <p className="text-2xl font-semibold text-heading">{forms.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">Total Leads</p>
                <p className="text-2xl font-semibold text-heading">{submissions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning/10 rounded-lg">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">This Month</p>
                <p className="text-2xl font-semibold text-heading">
                  {submissions.filter(s => {
                    const submissionDate = new Date(s.submittedAt);
                    const now = new Date();
                    return submissionDate.getMonth() === now.getMonth() && 
                           submissionDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">Conversion Rate</p>
                <p className="text-2xl font-semibold text-heading">
                  {forms.length > 0 ? Math.round((submissions.length / forms.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-panel rounded-3xl shadow-xl border border-border">
          <div className="border-b border-border rounded-t-3xl">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-secondary hover:border-secondary"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("forms")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "forms"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-secondary hover:border-secondary"
                }`}
              >
                Forms
              </button>
              <button
                onClick={() => setActiveTab("leads")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "leads"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-secondary hover:border-secondary"
                }`}
              >
                Leads
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === "overview" && (
              <div>
                <h2 className="text-lg font-medium text-heading mb-4">Welcome to Adparlay</h2>
                <p className="text-muted mb-6">
                  Manage your lead collection forms and track your business growth.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h3 className="font-medium text-primary">Create Forms</h3>
                    <p className="text-primary text-sm mt-1">Build custom lead collection forms</p>
                  </div>
                  <div className="bg-success/10 p-4 rounded-lg">
                    <h3 className="font-medium text-success">Track Leads</h3>
                    <p className="text-success text-sm mt-1">Monitor and manage your leads</p>
                  </div>
                  <div className="bg-secondary/10 p-4 rounded-lg">
                    <h3 className="font-medium text-secondary">Analytics</h3>
                    <p className="text-secondary text-sm mt-1">View performance insights</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "forms" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-heading">Your Forms</h2>
                  <button 
                    onClick={handleCreateForm}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create New Form
                  </button>
                </div>
                <div className="space-y-4">
                  {forms.length === 0 && (
                    <div className="text-muted">No forms yet. Click 'Create New Form' to get started.</div>
                  )}
                  {forms.map((form) => (
                    <div key={form.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-heading">{form.title}</h3>
                          <p className="text-sm text-muted">Created: {new Date(form.createdAt).toLocaleString()}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <button className="text-primary hover:text-primary/90 text-sm bg-primary/10 rounded px-3 py-1" onClick={() => window.open(`/form-preview/${form.id}`, '_blank')}>Preview</button>
                            <button className="text-muted hover:text-secondary text-sm bg-border rounded px-3 py-1" onClick={() => {navigator.clipboard.writeText(window.location.origin + `/form-preview/${form.id}`)}}>Copy Link</button>
                            <button className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 rounded px-3 py-1" onClick={() => navigate(`/form-builder?edit=${form.id}`)}>Edit</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "leads" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-heading">Recent Leads</h2>
                  <button className="text-primary hover:text-primary/90 text-sm">Export CSV</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-panel">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Form</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Responses</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-panel divide-y divide-border">
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-muted">
                            No submissions yet. Share your forms to start collecting leads!
                          </td>
                        </tr>
                      ) : (
                        submissions.map((submission) => (
                          <tr key={submission.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-heading">
                              {getFormTitle(submission.formId)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              {formatDate(submission.submittedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              {Object.keys(submission.formData).length} responses
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              <button 
                                className="text-primary hover:text-primary/90"
                                onClick={() => {
                                  alert(JSON.stringify(submission.formData, null, 2));
                                }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard; 