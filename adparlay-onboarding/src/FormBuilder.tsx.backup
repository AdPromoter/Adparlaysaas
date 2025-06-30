import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FieldModal from './FieldModal';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  options?: string[];
  conditional?: {
    dependsOn: string;
    value: string;
  };
}

interface FormData {
  id: string;
  title: string;
  description: string;
  mediaType: 'video' | 'image' | 'link';
  mediaUrl: string;
  mediaFile?: File;
  fields: FormField[];
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  createdAt: Date;
  isActive: boolean;
}

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    id: '',
    title: '',
    description: '',
    mediaType: 'video',
    mediaUrl: '',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        required: true
      }
    ],
    theme: {
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937'
    },
    createdAt: new Date(),
    isActive: true
  });

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email Input' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'select', label: 'Dropdown' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Buttons' }
  ];

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThemeChange = (field: keyof FormData['theme'], value: string) => {
    setFormData(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [field]: value
      }
    }));
  };

  const handleMediaFileChange = (file: File) => {
    setFormData(prev => ({
      ...prev,
      mediaFile: file,
      mediaUrl: URL.createObjectURL(file)
    }));
  };

  const addField = (fieldId: string, field: FormField) => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, { ...field, id: fieldId }]
    }));
    setShowFieldModal(false);
    setEditingField(null);
  };

  const updateField = (fieldId: string, updatedField: FormField) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? updatedField : field
      )
    }));
    setShowFieldModal(false);
    setEditingField(null);
  };

  const deleteField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const fields = [...prev.fields];
      const index = fields.findIndex(field => field.id === fieldId);
      
      if (direction === 'up' && index > 0) {
        [fields[index], fields[index - 1]] = [fields[index - 1], fields[index]];
      } else if (direction === 'down' && index < fields.length - 1) {
        [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
      }
      
      return { ...prev, fields };
    });
  };

  const saveForm = async () => {
    const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const finalFormData = {
      ...formData,
      id: formId
    };
    console.log('Saving form:', finalFormData);
    navigate('/dashboard');
  };

  const steps = [
    { title: 'Basic Info', component: 'basic' },
    { title: 'Media', component: 'media' },
    { title: 'Fields', component: 'fields' },
    { title: 'Theme', component: 'theme' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter form title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your form"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Media Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media Type
                </label>
                <select
                  value={formData.mediaType}
                  onChange={(e) => handleInputChange('mediaType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="link">External Link</option>
                </select>
              </div>
              
              {formData.mediaType === 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media URL
                  </label>
                  <input
                    type="url"
                    value={formData.mediaUrl}
                    onChange={(e) => handleInputChange('mediaUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/video"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload {formData.mediaType === 'video' ? 'Video' : 'Image'}
                  </label>
                  <input
                    type="file"
                    accept={formData.mediaType === 'video' ? 'video/*' : 'image/*'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaFileChange(file);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.mediaUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Preview:</p>
                      {formData.mediaType === 'video' ? (
                        <video controls className="mt-2 max-w-md rounded">
                          <source src={formData.mediaUrl} />
                        </video>
                      ) : (
                        <img src={formData.mediaUrl} alt="Preview" className="mt-2 max-w-md rounded" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Form Fields</h3>
              <button
                onClick={() => {
                  setEditingField(null);
                  setShowFieldModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Field
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{field.label}</span>
                        {field.required && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {field.type}
                        </span>
                      </div>
                      {field.conditional && (
                        <p className="text-xs text-gray-500 mt-1">
                          Shows when: {field.conditional.dependsOn} = {field.conditional.value}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveField(field.id, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveField(field.id, 'down')}
                        disabled={index === formData.fields.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => {
                          setEditingField(field);
                          setShowFieldModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Theme & Styling</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={formData.theme.primaryColor}
                  onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <input
                  type="color"
                  value={formData.theme.backgroundColor}
                  onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <input
                  type="color"
                  value={formData.theme.textColor}
                  onChange={(e) => handleThemeChange('textColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <div 
                className="border border-gray-200 rounded-lg p-6"
                style={{ backgroundColor: formData.theme.backgroundColor }}
              >
                <h2 style={{ color: formData.theme.textColor }} className="text-xl font-bold mb-2">
                  {formData.title || 'Form Title'}
                </h2>
                <p style={{ color: formData.theme.textColor }} className="text-sm mb-4">
                  {formData.description || 'Form description'}
                </p>
                <div className="space-y-3">
                  {formData.fields.slice(0, 2).map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium mb-1" style={{ color: formData.theme.textColor }}>
                        {field.label} {field.required && '*'}
                      </label>
                      <input
                        type={field.type === 'email' ? 'email' : 'text'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                        style={{ borderColor: formData.theme.primaryColor }}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-16 h-0.5 bg-gray-200 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={saveForm}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create Form
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <FieldModal
              field={editingField}
              onSave={editingField ? updateField : addField}
              onCancel={() => {
                setShowFieldModal(false);
                setEditingField(null);
              }}
              existingFields={formData.fields}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilder; 