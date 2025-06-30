import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  conditional?: {
    dependsOn: string;
    value: string;
    action: 'show' | 'hide' | 'goto';
    target?: string;
  };
}

interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
  order: number;
}

interface FormData {
  id: string;
  title: string;
  description: string;
  steps: FormStep[];
  mediaType: 'video' | 'image' | 'link';
  mediaUrl: string;
  mediaFile?: File;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    logo?: File;
    showProgressBar: boolean;
  };
  createdAt: Date;
}

const EnhancedFormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [draggedField, setDraggedField] = useState<FormField | null>(null);
  const [formData, setFormData] = useState<FormData>({
    id: Date.now().toString(),
    title: '',
    description: '',
    steps: [
      {
        id: 'step-1',
        title: 'Step 1',
        fields: [],
        order: 1
      }
    ],
    mediaType: 'video',
    mediaUrl: '',
    theme: {
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      fontFamily: 'Inter',
      showProgressBar: true
    },
    createdAt: new Date()
  });

  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'email', label: 'Email', icon: '📧' },
    { type: 'phone', label: 'Phone', icon: '📞' },
    { type: 'select', label: 'Dropdown', icon: '📋' },
    { type: 'radio', label: 'Multiple Choice', icon: '🔘' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { type: 'textarea', label: 'Long Text', icon: '📄' },
    { type: 'date', label: 'Date', icon: '📅' },
    { type: 'file', label: 'File Upload', icon: '📎' }
  ];

  const fonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat'];

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addStep = () => {
    const newStep: FormStep = {
      id: `step-${formData.steps.length + 1}`,
      title: `Step ${formData.steps.length + 1}`,
      fields: [],
      order: formData.steps.length + 1
    };
    updateFormData({
      steps: [...formData.steps, newStep]
    });
  };

  const addField = (stepId: string, fieldType: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: fieldType as any,
      label: `New ${fieldType} field`,
      required: false,
      options: fieldType === 'select' || fieldType === 'radio' ? ['Option 1', 'Option 2'] : undefined
    };

    const updatedSteps = formData.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          fields: [...step.fields, newField]
        };
      }
      return step;
    });

    updateFormData({ steps: updatedSteps });
  };

  const updateField = (stepId: string, fieldId: string, updates: Partial<FormField>) => {
    const updatedSteps = formData.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          fields: step.fields.map(field => {
            if (field.id === fieldId) {
              return { ...field, ...updates };
            }
            return field;
          })
        };
      }
      return step;
    });

    updateFormData({ steps: updatedSteps });
  };

  const deleteField = (stepId: string, fieldId: string) => {
    const updatedSteps = formData.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          fields: step.fields.filter(field => field.id !== fieldId)
        };
      }
      return step;
    });

    updateFormData({ steps: updatedSteps });
  };

  const handleDragStart = (field: FormField) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStepId: string, targetIndex?: number) => {
    if (draggedField) {
      // Remove from original step
      const updatedSteps = formData.steps.map(step => ({
        ...step,
        fields: step.fields.filter(field => field.id !== draggedField.id)
      }));

      // Add to target step
      const targetStep = updatedSteps.find(step => step.id === targetStepId);
      if (targetStep) {
        const insertIndex = targetIndex !== undefined ? targetIndex : targetStep.fields.length;
        targetStep.fields.splice(insertIndex, 0, draggedField);
      }

      updateFormData({ steps: updatedSteps });
      setDraggedField(null);
    }
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Visual Form Builder</h2>
        <p className="text-gray-600">Create your form with drag & drop interface</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Canvas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Form Canvas</h3>
              <button
                onClick={addStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Step
              </button>
            </div>

            <div className="space-y-4">
              {formData.steps.map((step, stepIndex) => (
                <motion.div
                  key={step.id}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(step.id)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const updatedSteps = [...formData.steps];
                        updatedSteps[stepIndex].title = e.target.value;
                        updateFormData({ steps: updatedSteps });
                      }}
                      className="text-lg font-semibold text-gray-800 bg-transparent border-none focus:outline-none"
                    />
                    <button
                      onClick={() => addField(step.id, 'text')}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      + Add Question
                    </button>
                  </div>

                  <div className="space-y-3">
                    {step.fields.map((field, fieldIndex) => (
                      <motion.div
                        key={field.id}
                        draggable
                        onDragStart={() => handleDragStart(field)}
                        className="bg-gray-50 p-3 rounded-lg border cursor-move hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(step.id, field.id, { label: e.target.value })}
                              className="font-medium text-gray-800 bg-transparent border-none focus:outline-none w-full"
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">{field.type}</span>
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateField(step.id, field.id, { required: e.target.checked })}
                                />
                                Required
                              </label>
                              <button
                                onClick={() => {/* Open logic editor */}}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Logic
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteField(step.id, field.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Field Palette */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Field Types</h3>
          <div className="space-y-2">
            {fieldTypes.map((fieldType) => (
              <motion.button
                key={fieldType.type}
                onClick={() => addField(formData.steps[0].id, fieldType.type)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{fieldType.icon}</span>
                  <span className="font-medium text-gray-800">{fieldType.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Conditional Logic Editor</h2>
        <p className="text-gray-600">Set up smart form flow with IF-THEN rules</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logic Rules */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Logic Rules</h3>
            <div className="space-y-4">
              {formData.steps.flatMap(step => step.fields).map(field => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">{field.label}</h4>
                  <div className="space-y-2">
                    <select className="w-full p-2 border border-gray-300 rounded">
                      <option>If user selects...</option>
                      {field.options?.map(option => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <select className="w-full p-2 border border-gray-300 rounded">
                      <option>Then...</option>
                      <option>Show next question</option>
                      <option>Skip to step</option>
                      <option>Hide question</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Flowchart */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Visual Flow</h3>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
              <div className="text-center text-gray-500">
                Visual flowchart will be rendered here
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Media Configuration</h2>
        <p className="text-gray-600">Add videos, images, or links to enhance your form</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Media Type Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Media Type</h3>
            <div className="space-y-3">
              {['video', 'image', 'link'].map((type) => (
                <label key={type} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="mediaType"
                    value={type}
                    checked={formData.mediaType === type}
                    onChange={(e) => updateFormData({ mediaType: e.target.value as any })}
                  />
                  <span className="capitalize font-medium">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Media Upload/Input */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Media Content</h3>
            {formData.mediaType === 'video' && (
              <div className="space-y-4">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      updateFormData({ mediaFile: file });
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="url"
                  placeholder="Or enter video URL"
                  value={formData.mediaUrl}
                  onChange={(e) => updateFormData({ mediaUrl: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            {formData.mediaType === 'image' && (
              <input
                type="file"
                accept="image/*"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            )}
            {formData.mediaType === 'link' && (
              <input
                type="url"
                placeholder="Enter media URL"
                value={formData.mediaUrl}
                onChange={(e) => updateFormData({ mediaUrl: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Design & Branding</h2>
        <p className="text-gray-600">Customize colors, fonts, and branding</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Color Customization */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Colors</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.theme.primaryColor}
                    onChange={(e) => updateFormData({
                      theme: { ...formData.theme, primaryColor: e.target.value }
                    })}
                    className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.theme.primaryColor}
                    onChange={(e) => updateFormData({
                      theme: { ...formData.theme, primaryColor: e.target.value }
                    })}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.theme.backgroundColor}
                    onChange={(e) => updateFormData({
                      theme: { ...formData.theme, backgroundColor: e.target.value }
                    })}
                    className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.theme.backgroundColor}
                    onChange={(e) => updateFormData({
                      theme: { ...formData.theme, backgroundColor: e.target.value }
                    })}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.theme.textColor}
                    onChange={(e) => updateFormData({
                      theme: { ...formData.theme, textColor: e.target.value }
                    })}
                    className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.theme.textColor}
                    onChange={(e) => updateFormData({
                      theme: { ...formData.theme, textColor: e.target.value }
                    })}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography & Branding */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Typography & Branding</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <select
                  value={formData.theme.fontFamily}
                  onChange={(e) => updateFormData({
                    theme: { ...formData.theme, fontFamily: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {fonts.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      updateFormData({
                        theme: { ...formData.theme, logo: file }
                      });
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.theme.showProgressBar}
                    onChange={(e) => updateFormData({
                      theme: { ...formData.theme, showProgressBar: e.target.checked }
                    })}
                  />
                  <span className="text-sm font-medium text-gray-700">Show Progress Bar</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
          <div 
            className="border border-gray-300 rounded-lg p-6"
            style={{
              backgroundColor: formData.theme.backgroundColor,
              color: formData.theme.textColor,
              fontFamily: formData.theme.fontFamily
            }}
          >
            <div className="text-center">
              <h4 className="text-xl font-bold mb-4">Form Preview</h4>
              <button
                className="px-6 py-2 rounded-lg text-white"
                style={{ backgroundColor: formData.theme.primaryColor }}
              >
                Sample Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  const handleSave = () => {
    console.log('Form saved:', formData);
    // Add your save logic here
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
            <p className="text-gray-600">Create beautiful forms with drag & drop</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of 4
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 4) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {currentStep === 4 ? (
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Form
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedFormBuilder; 