import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  option?: string;
  plotSize?: string;
  finalOption: string;
  timestamp: any;
  userId: string;
  lastUpdated?: any;
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  conversionPath?: string;
}

interface EditFormData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  option: string;
  plotSize: string;
  finalOption: string;
  status: string;
  notes: string;
}

interface FilterOptions {
  interest: string;
  status: string;
  dateRange: string;
  finalOption: string;
}

interface CustomizationSettings {
  primaryColor: string;
  secondaryColor: string;
  formLabels: {
    name: string;
    email: string;
    phone: string;
    interest: string;
    finalChoice: string;
  };
  exportDestination: string;
}

const AdminDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSubmission, setEditingSubmission] = useState<FormSubmission | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    email: '',
    phone: '',
    interest: '',
    option: '',
    plotSize: '',
    finalOption: '',
    status: 'new',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    interest: '',
    status: '',
    dateRange: '',
    finalOption: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customization, setCustomization] = useState<CustomizationSettings>({
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    formLabels: {
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      interest: 'Interest Type',
      finalChoice: 'Final Choice'
    },
    exportDestination: 'local'
  });
  const [conversionStats, setConversionStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0
  });

  const { getFormResponses, updateFormResponse, logout } = useFirebase();
  const navigate = useNavigate();

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [submissions, filters]);

  useEffect(() => {
    calculateConversionStats();
  }, [submissions]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getFormResponses();
      // Add default status to submissions that don't have one
      const submissionsWithStatus = data.map((sub: FormSubmission) => ({
        ...sub,
        status: sub.status || 'new',
        notes: sub.notes || '',
        conversionPath: sub.conversionPath || 'Direct Form Submission'
      }));
      setSubmissions(submissionsWithStatus);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    if (filters.interest) {
      filtered = filtered.filter(sub => sub.interest === filters.interest);
    }

    if (filters.status) {
      filtered = filtered.filter(sub => sub.status === filters.status);
    }

    if (filters.finalOption) {
      filtered = filtered.filter(sub => sub.finalOption === filters.finalOption);
    }

    if (filters.dateRange) {
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(sub => {
        const submissionDate = sub.timestamp?.toDate?.() || new Date(sub.timestamp);
        return submissionDate >= startDate;
      });
    }

    setFilteredSubmissions(filtered);
  };

  const calculateConversionStats = () => {
    const stats = {
      total: submissions.length,
      new: submissions.filter(s => s.status === 'new').length,
      contacted: submissions.filter(s => s.status === 'contacted').length,
      qualified: submissions.filter(s => s.status === 'qualified').length,
      converted: submissions.filter(s => s.status === 'converted').length,
      lost: submissions.filter(s => s.status === 'lost').length,
      conversionRate: 0
    };
    
    stats.conversionRate = stats.total > 0 ? (stats.converted / stats.total) * 100 : 0;
    setConversionStats(stats);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (submission: FormSubmission) => {
    setEditingSubmission(submission);
    setEditFormData({
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      interest: submission.interest,
      option: submission.option || '',
      plotSize: submission.plotSize || '',
      finalOption: submission.finalOption,
      status: submission.status || 'new',
      notes: submission.notes || ''
    });
  };

  const closeEditModal = () => {
    setEditingSubmission(null);
    setEditFormData({
      name: '',
      email: '',
      phone: '',
      interest: '',
      option: '',
      plotSize: '',
      finalOption: '',
      status: 'new',
      notes: ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;

    try {
      setSaving(true);
      await updateFormResponse(editingSubmission.id, editFormData);
      await loadSubmissions();
      closeEditModal();
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Name', 'Email', 'Phone', 'Interest', 'Option', 'Plot Size', 
      'Final Choice', 'Status', 'Notes', 'Date', 'Last Updated', 'Conversion Path'
    ];
    const csvData = filteredSubmissions.map(sub => [
      sub.name,
      sub.email,
      sub.phone,
      sub.interest,
      sub.option || '',
      sub.plotSize || '',
      sub.finalOption,
      sub.status || 'new',
      sub.notes || '',
      new Date(sub.timestamp?.toDate?.() || sub.timestamp).toLocaleDateString(),
      sub.lastUpdated ? new Date(sub.lastUpdated?.toDate?.() || sub.lastUpdated).toLocaleDateString() : 'Never',
      sub.conversionPath || 'Direct Form Submission'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // Simple PDF export using window.print() for now
    // In a real implementation, you'd use a library like jsPDF
    window.print();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lead Management Dashboard</h1>
              <p className="text-gray-600">2 Seasons Property Management</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/admin/settings')}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Customize
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Conversion Stats */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Total Leads</h3>
            <p className="text-3xl font-bold text-blue-600">{conversionStats.total}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">New</h3>
            <p className="text-3xl font-bold text-blue-600">{conversionStats.new}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Contacted</h3>
            <p className="text-3xl font-bold text-yellow-600">{conversionStats.contacted}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Qualified</h3>
            <p className="text-3xl font-bold text-purple-600">{conversionStats.qualified}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Converted</h3>
            <p className="text-3xl font-bold text-green-600">{conversionStats.converted}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Lost</h3>
            <p className="text-3xl font-bold text-red-600">{conversionStats.lost}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
            <p className="text-3xl font-bold text-indigo-600">{conversionStats.conversionRate.toFixed(1)}%</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Lead Management</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Type</label>
                  <select
                    value={filters.interest}
                    onChange={(e) => setFilters({...filters, interest: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Interests</option>
                    <option value="Buying">Buying</option>
                    <option value="Selling">Selling</option>
                    <option value="Renting">Renting</option>
                    <option value="Investing">Investing</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Final Choice</label>
                  <select
                    value={filters.finalOption}
                    onChange={(e) => setFilters({...filters, finalOption: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Choices</option>
                    <option value="Option 1">Option 1</option>
                    <option value="Option 2">Option 2</option>
                    <option value="Option 3">Option 3</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Leads ({filteredSubmissions.length} of {submissions.length})
            </h2>
          </div>
          
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No leads found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Choice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission, index) => (
                    <motion.tr
                      key={submission.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{submission.name}</div>
                        <div className="text-sm text-gray-500">{submission.email}</div>
                        <div className="text-sm text-gray-500">{submission.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.interest}</div>
                        {submission.option && (
                          <div className="text-sm text-gray-500">{submission.option}</div>
                        )}
                        {submission.plotSize && (
                          <div className="text-sm text-gray-500">{submission.plotSize}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status || 'new')}`}>
                          {submission.status || 'new'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {submission.finalOption}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openEditModal(submission)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit Lead</h3>
                <p className="text-sm text-gray-500">Update lead information and status</p>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest *
                    </label>
                    <select
                      value={editFormData.interest}
                      onChange={(e) => setEditFormData({...editFormData, interest: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Interest</option>
                      <option value="Buying">Buying</option>
                      <option value="Selling">Selling</option>
                      <option value="Renting">Renting</option>
                      <option value="Investing">Investing</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Final Choice *
                    </label>
                    <select
                      value={editFormData.finalOption}
                      onChange={(e) => setEditFormData({...editFormData, finalOption: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Final Choice</option>
                      <option value="Option 1">Option 1</option>
                      <option value="Option 2">Option 2</option>
                      <option value="Option 3">Option 3</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option
                    </label>
                    <input
                      type="text"
                      value={editFormData.option}
                      onChange={(e) => setEditFormData({...editFormData, option: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plot Size
                    </label>
                    <input
                      type="text"
                      value={editFormData.plotSize}
                      onChange={(e) => setEditFormData({...editFormData, plotSize: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes about this lead..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customization Modal */}
      <AnimatePresence>
        {showCustomization && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Customize Form</h3>
                <p className="text-sm text-gray-500">Customize form appearance and settings</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Colors</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={customization.primaryColor}
                        onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Secondary Color
                      </label>
                      <input
                        type="color"
                        value={customization.secondaryColor}
                        onChange={(e) => setCustomization({...customization, secondaryColor: e.target.value})}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Form Labels</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name Label
                      </label>
                      <input
                        type="text"
                        value={customization.formLabels.name}
                        onChange={(e) => setCustomization({
                          ...customization, 
                          formLabels: {...customization.formLabels, name: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Label
                      </label>
                      <input
                        type="text"
                        value={customization.formLabels.email}
                        onChange={(e) => setCustomization({
                          ...customization, 
                          formLabels: {...customization.formLabels, email: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Label
                      </label>
                      <input
                        type="text"
                        value={customization.formLabels.phone}
                        onChange={(e) => setCustomization({
                          ...customization, 
                          formLabels: {...customization.formLabels, phone: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interest Label
                      </label>
                      <input
                        type="text"
                        value={customization.formLabels.interest}
                        onChange={(e) => setCustomization({
                          ...customization, 
                          formLabels: {...customization.formLabels, interest: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Export Settings</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Export Destination
                    </label>
                    <select
                      value={customization.exportDestination}
                      onChange={(e) => setCustomization({...customization, exportDestination: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="local">Local Download</option>
                      <option value="email">Email Export</option>
                      <option value="cloud">Cloud Storage</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCustomization(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard; 