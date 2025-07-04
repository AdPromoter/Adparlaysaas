import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

interface Question {
  id: string;
  type: string;
  label: string;
  helpText?: string;
  required: boolean;
  isEditing: boolean;
  options?: string[];
  blockId: string;
  conditionalLogic?: Array<{
    option: string;
    targetBlockId?: string;
  }>;
}

interface Block {
  id: string;
  title: string;
  isEditing: boolean;
}

// --- TEMPLATES ---
const FORM_TEMPLATES = [
  {
    name: 'Contact Form',
    blocks: [
      { id: 'block-contact', title: 'Contact Information', isEditing: false }
    ],
    questions: [
      { id: 'q-name', type: 'text', label: 'Full Name', helpText: '', required: true, isEditing: false, blockId: 'block-contact', options: [], conditionalLogic: [] },
      { id: 'q-email', type: 'email', label: 'Email Address', helpText: '', required: true, isEditing: false, blockId: 'block-contact', options: [], conditionalLogic: [] },
      { id: 'q-message', type: 'textarea', label: 'Message', helpText: '', required: false, isEditing: false, blockId: 'block-contact', options: [], conditionalLogic: [] }
    ],
    media: { type: '' as '', url: '', primaryText: '', secondaryText: '' }
  },
  {
    name: 'Event Registration',
    blocks: [
      { id: 'block-event', title: 'Event Registration', isEditing: false }
    ],
    questions: [
      { id: 'q-name', type: 'text', label: 'Full Name', helpText: '', required: true, isEditing: false, blockId: 'block-event', options: [], conditionalLogic: [] },
      { id: 'q-email', type: 'email', label: 'Email Address', helpText: '', required: true, isEditing: false, blockId: 'block-event', options: [], conditionalLogic: [] },
      { id: 'q-ticket', type: 'select', label: 'Ticket Type', helpText: '', required: true, isEditing: false, blockId: 'block-event', options: ['Standard', 'VIP', 'Student'], conditionalLogic: [] }
    ],
    media: { type: '' as '', url: '', primaryText: '', secondaryText: '' }
  },
  {
    name: 'Feedback Survey',
    blocks: [
      { id: 'block-feedback', title: 'Feedback', isEditing: false }
    ],
    questions: [
      { id: 'q-satisfaction', type: 'radio', label: 'How satisfied are you?', helpText: '', required: true, isEditing: false, blockId: 'block-feedback', options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'], conditionalLogic: [] },
      { id: 'q-comments', type: 'textarea', label: 'Additional Comments', helpText: '', required: false, isEditing: false, blockId: 'block-feedback', options: [], conditionalLogic: [] }
    ],
    media: { type: '' as '', url: '', primaryText: '', secondaryText: '' }
  }
];

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [logicModal, setLogicModal] = useState<{
    questionId: string;
    optionIndex: number;
    blockId: string;
  } | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  // Autosave and navigation modal state
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [media, setMedia] = useState<{ type: 'image' | 'video' | 'embed' | ''; url: string; primaryText?: string; secondaryText?: string }>({ type: '', url: '', primaryText: '', secondaryText: '' });
  const [postSaveModal, setPostSaveModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSavedFormId, setLastSavedFormId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>(blocks[0]?.title || 'Untitled Form');
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [formStyle, setFormStyle] = useState({
    formBgType: 'solid', // 'solid' or 'gradient'
    formBg: '#f9fafb',
    formGradientFrom: '#f9fafb',
    formGradientTo: '#e0e7ef',
    formGradientDir: 'to right',
    blockBgType: 'solid',
    blockBg: '#ffffff',
    blockGradientFrom: '#ffffff',
    blockGradientTo: '#f3f4f6',
    blockGradientDir: 'to bottom',
    fontColor: '#1f2937',
  });
  const [isFormSaved, setIsFormSaved] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Check for edit mode on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editFormId = searchParams.get('edit');
    
    if (editFormId) {
      setIsEditMode(true);
      setEditingFormId(editFormId);
      loadFormForEditing(editFormId);
    }
  }, [location.search]);

  // Load form data for editing
  const loadFormForEditing = (formId: string) => {
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const formToEdit = forms.find((form: any) => form.id === formId);
    
    if (formToEdit) {
      setBlocks(formToEdit.blocks || []);
      setQuestions(formToEdit.questions || []);
      setMedia(formToEdit.media || { type: '', url: '', primaryText: '', secondaryText: '' });
      setShowWelcome(false);
      setLastSavedFormId(formId);
    }
  };

  // Autosave to localStorage
  useEffect(() => {
    if (blocks.length > 0 || questions.length > 0) {
      localStorage.setItem('formbuilder_draft_blocks', JSON.stringify(blocks));
      localStorage.setItem('formbuilder_draft_questions', JSON.stringify(questions));
      setHasUnsaved(true);
    }
  }, [blocks, questions]);

  // On mount, check for draft (only if not in edit mode)
  useEffect(() => {
    if (!isEditMode) {
      const draftBlocks = localStorage.getItem('formbuilder_draft_blocks');
      const draftQuestions = localStorage.getItem('formbuilder_draft_questions');
      if ((draftBlocks && JSON.parse(draftBlocks).length > 0) || (draftQuestions && JSON.parse(draftQuestions).length > 0)) {
        setShowRestorePrompt(true);
      }
    }
  }, [isEditMode]);

  // Restore draft
  const handleRestoreDraft = () => {
    const draftBlocks = localStorage.getItem('formbuilder_draft_blocks');
    const draftQuestions = localStorage.getItem('formbuilder_draft_questions');
    if (draftBlocks) setBlocks(JSON.parse(draftBlocks));
    if (draftQuestions) setQuestions(JSON.parse(draftQuestions));
    setShowRestorePrompt(false);
  };
  // Discard draft
  const handleDiscardDraft = () => {
    localStorage.removeItem('formbuilder_draft_blocks');
    localStorage.removeItem('formbuilder_draft_questions');
    setShowRestorePrompt(false);
  };

  // Save and go to dashboard
  const handleSaveAndGo = async () => {
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const formTitle = formName || blocks[0]?.title || 'Untitled Form';
    let formId = isEditMode && editingFormId ? editingFormId : `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let form;
    if (isEditMode && editingFormId) {
      // Update existing form
      const formIndex = forms.findIndex((form: any) => form.id === editingFormId);
      if (formIndex !== -1) {
        forms[formIndex] = {
          ...forms[formIndex],
          title: formTitle,
          blocks,
          questions,
          media,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('forms', JSON.stringify(forms));
        setLastSavedFormId(editingFormId);
        form = forms[formIndex];
      }
    } else {
      // Create new form
      form = {
        id: formId,
        title: formTitle,
        blocks,
        questions,
        media,
        createdAt: new Date().toISOString()
      };
      forms.push(form);
      localStorage.setItem('forms', JSON.stringify(forms));
      setLastSavedFormId(formId);
    }
    // Save to Firestore
    try {
      await setDoc(doc(db, 'forms', formId), form);
    } catch (e) {
      // Optionally show error to user
      console.error('Failed to save form to Firestore:', e);
    }
    // Remove draft
    localStorage.removeItem('formbuilder_draft_blocks');
    localStorage.removeItem('formbuilder_draft_questions');
    setHasUnsaved(false);
    localStorage.setItem('dashboard_reload', Date.now().toString());
    navigate('/dashboard');
    setIsFormSaved(true);
  };
  // Discard and go to dashboard
  const handleDiscardAndGo = () => {
    localStorage.removeItem('formbuilder_draft_blocks');
    localStorage.removeItem('formbuilder_draft_questions');
    setHasUnsaved(false);
    navigate('/dashboard');
  };

  // Intercept dashboard navigation
  const handleDashboardClick = () => {
    if (hasUnsaved && (blocks.length > 0 || questions.length > 0)) {
      setShowNavModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  const addBlock = () => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      title: 'New Question Block',
      isEditing: true
    };
    setBlocks([...blocks, newBlock]);
    setShowWelcome(false);
  };

  const addQuestionToBlock = (blockId: string) => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: 'text',
      label: 'New Question',
      helpText: '',
      required: false,
      isEditing: true,
      blockId,
      options: [],
      conditionalLogic: []
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleSaveBlock = (blockId: string) => {
    setBlocks(blocks.map(block => 
      block.id === blockId 
        ? { ...block, isEditing: false }
        : block
    ));
    setQuestions(questions.map(question => 
      question.blockId === blockId 
        ? { ...question, isEditing: false }
        : question
    ));
  };

  useEffect(() => {
    const draftBlocks = localStorage.getItem('formbuilder_draft_blocks');
    const draftQuestions = localStorage.getItem('formbuilder_draft_questions');
    if (!draftBlocks && !draftQuestions && blocks.length === 0 && questions.length === 0) {
      // Add default block and questions
      const blockId = `block-${Date.now()}`;
      setBlocks([
        {
          id: blockId,
          title: 'Contact Information',
          isEditing: false
        }
      ]);
      setQuestions([
        {
          id: `question-${Date.now()}-1`,
          type: 'text',
          label: 'Name',
          helpText: '',
          required: true,
          isEditing: false,
          blockId,
          options: [],
          conditionalLogic: []
        },
        {
          id: `question-${Date.now()}-2`,
          type: 'email',
          label: 'Email',
          helpText: '',
          required: true,
          isEditing: false,
          blockId,
          options: [],
          conditionalLogic: []
        },
        {
          id: `question-${Date.now()}-3`,
          type: 'phone',
          label: 'Phone Number',
          helpText: '',
          required: true,
          isEditing: false,
          blockId,
          options: [],
          conditionalLogic: []
        }
      ]);
    }
    // eslint-disable-next-line
  }, []);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reorderedBlocks = Array.from(blocks);
    const [removed] = reorderedBlocks.splice(result.source.index, 1);
    reorderedBlocks.splice(result.destination.index, 0, removed);
    setBlocks(reorderedBlocks);
  };

  useEffect(() => {
    if (hasUnsaved) setIsFormSaved(false);
  }, [blocks, questions, media, hasUnsaved]);

  // Add this function to load a template
  const handleTemplateSelect = (templateIdx: number) => {
    const template = FORM_TEMPLATES[templateIdx];
    setBlocks(template.blocks.map(b => ({ ...b, id: `${b.id}-${Date.now()}` })));
    setQuestions(template.questions.map(q => ({ ...q, id: `${q.id}-${Date.now()}`, blockId: `${q.blockId}-${Date.now()}` })));
    setMedia(template.media || { type: '', url: '' });
    setFormName(template.name);
    setShowWelcome(false);
    setShowTemplateModal(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 font-sans">
      {/* Back to Dashboard Button */}
      <div className="mb-6 flex items-center">
        <button
          onClick={handleDashboardClick}
          className="flex items-center gap-2 px-4 py-2 bg-panel text-primary rounded-xl shadow hover:bg-secondary/10 transition-colors font-semibold border border-border"
        >
          <span className="text-lg">←</span> Dashboard
        </button>
      </div>
      {showWelcome && (
        <div className="max-w-2xl mx-auto bg-panel rounded-3xl shadow-2xl p-10 text-center border border-border">
          <h1 className="text-4xl font-extrabold text-heading mb-6 tracking-tight">Welcome to Form Builder</h1>
          <p className="text-body mb-8 text-lg">Start building your form by adding a question block or using a template.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={addBlock}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-lg shadow hover:bg-primary/90 transition-colors"
            >
              Add Question Block
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow hover:bg-blue-700 transition-colors"
            >
              Create from Template
            </button>
          </div>
        </div>
      )}

      {!showWelcome && (
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <label className="text-lg font-semibold text-heading" htmlFor="form-name-input">Form Name</label>
              <input
                id="form-name-input"
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 border border-border rounded-lg bg-background text-body focus:ring-2 focus:ring-primary focus:outline-none font-bold text-lg"
                placeholder="Enter form name"
              />
            </div>
            <button
              onClick={addBlock}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-lg shadow hover:bg-primary/90 transition-colors mt-4 sm:mt-0"
            >
              Add Question Block
            </button>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowStyleModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-semibold shadow hover:bg-primary/90 transition-all text-base focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              style={{ letterSpacing: '0.02em' }}
            >
              <span role="img" aria-label="palette">🎨</span> Customize Form Style
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="blocks-droppable">
              {(provided) => (
                <div
                  style={{
                    background: formStyle.formBgType === 'gradient'
                      ? `linear-gradient(${formStyle.formGradientDir}, ${formStyle.formGradientFrom}, ${formStyle.formGradientTo})`
                      : formStyle.formBg,
                    color: formStyle.fontColor,
                    borderRadius: '1.5rem',
                    padding: '1rem',
                  }}
                  className="space-y-10"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {blocks.map((block, index) => (
                    <Draggable key={block.id} draggableId={block.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white rounded-3xl shadow-xl p-8 border border-border mb-8 transition-shadow ${snapshot.isDragging ? 'shadow-2xl' : ''}`}
                          style={{ background: formStyle.blockBgType === 'gradient'
                            ? `linear-gradient(${formStyle.blockGradientDir}, ${formStyle.blockGradientFrom}, ${formStyle.blockGradientTo})`
                            : formStyle.blockBg }}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                            <span {...provided.dragHandleProps} className="cursor-grab mr-2 text-gray-400 hover:text-gray-700 flex items-center" title="Drag to reorder">
                              &#9776;
                            </span>
                            {block.isEditing ? (
                              <input
                                type="text"
                                value={block.title}
                                onChange={(e) => setBlocks(blocks.map(b => 
                                  b.id === block.id ? { ...b, title: e.target.value } : b
                                ))}
                                className="w-full sm:w-auto text-2xl font-bold px-4 py-2 border border-border rounded-lg bg-background text-body focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="Block Title"
                              />
                            ) : (
                              <h2 className="text-2xl font-bold text-heading">{block.title}</h2>
                            )}
                            
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              {block.isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveBlock(block.id)}
                                    className="w-full sm:w-auto px-5 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 font-semibold"
                                  >
                                    Save Block
                                  </button>
                                  <button
                                    onClick={() => addQuestionToBlock(block.id)}
                                    className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 font-semibold"
                                  >
                                    Add Question
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setBlocks(blocks.map(b => 
                                      b.id === block.id ? { ...b, isEditing: true } : b
                                    ))}
                                    className="w-full sm:w-auto px-5 py-2 bg-blue-100 text-blue-700 rounded-xl shadow hover:bg-blue-200 font-semibold"
                                  >
                                    Edit Block
                                  </button>
                                  <button
                                    onClick={() => {
                                      setBlocks(blocks.filter(b => b.id !== block.id));
                                      setQuestions(questions.filter(q => q.blockId !== block.id));
                                    }}
                                    className="w-full sm:w-auto px-5 py-2 bg-red-100 text-red-700 rounded-xl shadow hover:bg-red-200 font-semibold"
                                  >
                                    Delete Block
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="space-y-6">
                            {questions
                              .filter(question => question.blockId === block.id)
                              .map(question => (
                                <div key={question.id} className="border border-border rounded-2xl p-6 bg-blue-50/50 shadow-sm">
                                  {question.isEditing ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">{getTypeIcon(question.type)}</span>
                                        <h3 className="text-lg font-semibold text-gray-800">Edit Question</h3>
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                                        <select
                                          value={question.type}
                                          onChange={(e) => setQuestions(questions.map(q => 
                                            q.id === question.id 
                                              ? { ...q, type: e.target.value }
                                              : q
                                          ))}
                                          className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        >
                                          <option value="text">📝 Text Input</option>
                                          <option value="email">📧 Email</option>
                                          <option value="phone">📞 Phone</option>
                                          <option value="select">📋 Dropdown</option>
                                          <option value="radio">🔘 Multiple Choice</option>
                                          <option value="checkbox">☑️ Checkboxes</option>
                                          <option value="textarea">📄 Long Text</option>
                                          <option value="date">📅 Date</option>
                                          <option value="file">📎 File Upload</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Label</label>
                                        <input
                                          type="text"
                                          value={question.label}
                                          onChange={(e) => setQuestions(questions.map(q => 
                                            q.id === question.id 
                                              ? { ...q, label: e.target.value }
                                              : q
                                          ))}
                                          className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                          placeholder="Enter your question..."
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Help Text (Optional)</label>
                                        <input
                                          type="text"
                                          value={question.helpText || ''}
                                          onChange={(e) => setQuestions(questions.map(q => 
                                            q.id === question.id 
                                              ? { ...q, helpText: e.target.value }
                                              : q
                                          ))}
                                          className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                          placeholder="Add helpful text for users..."
                                        />
                                      </div>

                                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <input
                                          type="checkbox"
                                          checked={question.required}
                                          onChange={(e) => setQuestions(questions.map(q => 
                                            q.id === question.id 
                                              ? { ...q, required: e.target.checked }
                                              : q
                                          ))}
                                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Required field</span>
                                      </div>

                                      {['select', 'radio', 'checkbox'].includes(question.type) && (
                                        <div className="space-y-3">
                                          <label className="block text-sm font-medium text-gray-700">Options</label>
                                          {question.options?.map((option, optionIndex) => (
                                            <div key={optionIndex} className="flex items-center gap-2">
                                              <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                  const newOptions = [...(question.options || [])];
                                                  newOptions[optionIndex] = e.target.value;
                                                  setQuestions(questions.map(q => 
                                                    q.id === question.id ? { ...q, options: newOptions } : q
                                                  ));
                                                }}
                                                className="w-full px-3 py-1 border rounded"
                                                placeholder={`Option ${optionIndex + 1}`}
                                              />
                                              <button
                                                onClick={() => {
                                                  const newOptions = (question.options || []).filter((_, i) => i !== optionIndex);
                                                  setQuestions(questions.map(q => 
                                                    q.id === question.id ? { ...q, options: newOptions } : q
                                                  ));
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                              >
                                                🗑️
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setLogicModal({
                                                    questionId: question.id,
                                                    optionIndex,
                                                    blockId: block.id
                                                  });
                                                  // Find existing logic for this option, if any
                                                  const existingLogic = question.conditionalLogic?.find(
                                                    (l) => l.option === option
                                                  );
                                                  setSelectedTarget(existingLogic?.targetBlockId || '');
                                                }}
                                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
                                              >
                                                Add Logic
                                              </button>
                                            </div>
                                          ))}
                                          <button
                                            onClick={() => {
                                              const newOptions = [...(question.options || []), ''];
                                              setQuestions(questions.map(q => 
                                                q.id === question.id ? { ...q, options: newOptions } : q
                                              ));
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                          >
                                            + Add Option
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">{getTypeIcon(question.type)}</span>
                                            <span className="text-xs text-muted uppercase tracking-wide font-medium bg-background px-3 py-1 rounded-full font-medium">
                                              {question.type}
                                            </span>
                                          </div>
                                          <h3 className="font-semibold text-gray-900 text-lg">{question.label}</h3>
                                          {question.helpText && (
                                            <p className="text-sm text-gray-600 mt-2 italic">💡 {question.helpText}</p>
                                          )}
                                          {question.required && (
                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium mt-2">
                                              ⚠️ Required
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => setQuestions(questions.map(q => 
                                              q.id === question.id 
                                                ? { ...q, isEditing: true }
                                                : q
                                            ))}
                                            className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                                          >
                                            ✏️ Edit
                                          </button>
                                          <button
                                            onClick={() => setQuestions(questions.filter(q => q.id !== question.id))}
                                            className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                                          >
                                            🗑️ Delete
                                          </button>
                                        </div>
                                      </div>

                                      {(question.type === 'select' || question.type === 'radio' || question.type === 'checkbox') && (
                                        <div className="mt-4 space-y-2">
                                          {question.options?.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                              <span className="text-gray-600">{option}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                          <div className="flex justify-end mt-6">
                            <button
                              onClick={addBlock}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold shadow hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                              <span className="text-lg">＋</span> Add Question Block
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          {/* Save Form Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                handleSaveAndGo();
                setPostSaveModal(true);
              }}
              className={`px-8 py-3 rounded-xl shadow-lg text-lg font-bold transition-colors w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isFormSaved ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary text-white hover:bg-primary/90'}`}
              disabled={isFormSaved}
            >
              {isFormSaved ? 'Form Saved!' : '💾 Save Form'}
            </button>
          </div>
          {logicModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Add Logic</h3>
                <p className="text-gray-600 mb-1">
                  When this option is selected...
                </p>
                <p className="font-medium text-gray-800 mb-4">
                  {`"${questions.find(q => q.id === logicModal.questionId)?.options?.[logicModal.optionIndex]}"`}
                </p>

                <label htmlFor="target-block" className="block text-sm font-medium text-gray-700 mb-2">
                  Go to this block:
                </label>
                <select
                  id="target-block"
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                >
                  <option value="">-- Select Next Block --</option>
                  {blocks
                    .filter(b => b.id !== logicModal.blockId)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                </select>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setLogicModal(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const question = questions.find(q => q.id === logicModal.questionId);
                      if (question && question.options) {
                        const option = question.options[logicModal.optionIndex];
                        let existingLogic = question.conditionalLogic || [];
                        
                        // Remove existing logic for this option if it exists
                        existingLogic = existingLogic.filter(l => l.option !== option);

                        // Add new logic if a target is selected
                        if (selectedTarget) {
                          existingLogic.push({ option, targetBlockId: selectedTarget });
                        }
                        
                        setQuestions(questions.map(q => 
                          q.id === logicModal.questionId
                            ? { ...q, conditionalLogic: existingLogic }
                            : q
                        ));
                      }
                      setLogicModal(null);
                      setSelectedTarget('');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Logic
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Form Preview Modal */}
          {previewOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
              <div className="bg-white w-full h-full sm:w-[600px] sm:h-auto sm:rounded-2xl shadow-xl flex flex-col relative animate-fadein overflow-y-auto">
                <button
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl z-10"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Close Preview"
                >
                  ×
                </button>
                <FormPreview blocks={blocks} questions={questions} media={media} />
              </div>
            </div>
          )}
          {/* Restore Draft Modal */}
          {showRestorePrompt && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto shadow-lg">
                <h3 className="text-lg font-bold mb-4">Restore Unsaved Form?</h3>
                <p className="mb-4 text-gray-700">A draft form was found. Would you like to restore it?</p>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={handleDiscardDraft}>Discard</button>
                  <button className="px-4 py-2 rounded bg-blue-600 text-white font-bold" onClick={handleRestoreDraft}>Restore</button>
                </div>
              </div>
            </div>
          )}
          {/* Navigation Modal */}
          {showNavModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto shadow-lg">
                <h3 className="text-lg font-bold mb-4">Leave Form Builder?</h3>
                <p className="mb-4 text-gray-700">Do you want to save your form before leaving?</p>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={() => setShowNavModal(false)}>Cancel</button>
                  <button className="px-4 py-2 rounded bg-red-600 text-white font-bold" onClick={handleDiscardAndGo}>Discard & Go</button>
                  <button className="px-4 py-2 rounded bg-green-600 text-white font-bold" onClick={handleSaveAndGo}>Save & Go</button>
                </div>
              </div>
            </div>
          )}
          {/* Post-Save Modal */}
          {postSaveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Form Saved!</h3>
                <p className="mb-6">What would you like to do next?</p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setPreviewOpen(true);
                      setPostSaveModal(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Preview Form
                  </button>
                  <CopyShareableLinkButton lastSavedFormId={lastSavedFormId} />
                  <button
                    onClick={() => setPostSaveModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {showStyleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity animate-fadein" />
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg mx-auto animate-fadein-up border border-border">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl focus:outline-none"
                  onClick={() => setShowStyleModal(false)}
                  aria-label="Close"
                >
                  ×
                </button>
                <h2 className="text-2xl font-extrabold mb-6 text-center text-primary tracking-tight">Customize Form Style</h2>
                <div className="space-y-8">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-heading">Form Background</h3>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        className={`px-4 py-1.5 rounded-full font-medium border ${formStyle.formBgType === 'solid' ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                        onClick={() => setFormStyle(s => ({ ...s, formBgType: 'solid' }))}
                      >Solid</button>
                      <button
                        type="button"
                        className={`px-4 py-1.5 rounded-full font-medium border ${formStyle.formBgType === 'gradient' ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                        onClick={() => setFormStyle(s => ({ ...s, formBgType: 'gradient' }))}
                      >Gradient</button>
                    </div>
                    {formStyle.formBgType === 'solid' ? (
                      <div className="flex items-center gap-3">
                        <input type="color" value={formStyle.formBg} onChange={e => setFormStyle(s => ({ ...s, formBg: e.target.value }))} className="w-10 h-10 rounded-full border-2 border-border shadow" />
                        <span className="text-sm text-muted">Preview</span>
                        <span className="inline-block w-8 h-8 rounded-full border border-border" style={{ background: formStyle.formBg }} />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span>From</span>
                          <input type="color" value={formStyle.formGradientFrom} onChange={e => setFormStyle(s => ({ ...s, formGradientFrom: e.target.value }))} className="w-8 h-8 rounded-full border-2 border-border shadow" />
                          <span>To</span>
                          <input type="color" value={formStyle.formGradientTo} onChange={e => setFormStyle(s => ({ ...s, formGradientTo: e.target.value }))} className="w-8 h-8 rounded-full border-2 border-border shadow" />
                          <span className="text-sm text-muted">Preview</span>
                          <span className="inline-block w-16 h-8 rounded-full border border-border" style={{ background: `linear-gradient(${formStyle.formGradientDir}, ${formStyle.formGradientFrom}, ${formStyle.formGradientTo})` }} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Direction</label>
                          <select value={formStyle.formGradientDir} onChange={e => setFormStyle(s => ({ ...s, formGradientDir: e.target.value }))} className="w-full border rounded p-2">
                            <option value="to right">Left → Right</option>
                            <option value="to left">Right → Left</option>
                            <option value="to bottom">Top → Bottom</option>
                            <option value="to top">Bottom → Top</option>
                            <option value="135deg">Diagonal</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-heading">Block Background</h3>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        className={`px-4 py-1.5 rounded-full font-medium border ${formStyle.blockBgType === 'solid' ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                        onClick={() => setFormStyle(s => ({ ...s, blockBgType: 'solid' }))}
                      >Solid</button>
                      <button
                        type="button"
                        className={`px-4 py-1.5 rounded-full font-medium border ${formStyle.blockBgType === 'gradient' ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                        onClick={() => setFormStyle(s => ({ ...s, blockBgType: 'gradient' }))}
                      >Gradient</button>
                    </div>
                    {formStyle.blockBgType === 'solid' ? (
                      <div className="flex items-center gap-3">
                        <input type="color" value={formStyle.blockBg} onChange={e => setFormStyle(s => ({ ...s, blockBg: e.target.value }))} className="w-10 h-10 rounded-full border-2 border-border shadow" />
                        <span className="text-sm text-muted">Preview</span>
                        <span className="inline-block w-8 h-8 rounded-full border border-border" style={{ background: formStyle.blockBg }} />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span>From</span>
                          <input type="color" value={formStyle.blockGradientFrom} onChange={e => setFormStyle(s => ({ ...s, blockGradientFrom: e.target.value }))} className="w-8 h-8 rounded-full border-2 border-border shadow" />
                          <span>To</span>
                          <input type="color" value={formStyle.blockGradientTo} onChange={e => setFormStyle(s => ({ ...s, blockGradientTo: e.target.value }))} className="w-8 h-8 rounded-full border-2 border-border shadow" />
                          <span className="text-sm text-muted">Preview</span>
                          <span className="inline-block w-16 h-8 rounded-full border border-border" style={{ background: `linear-gradient(${formStyle.blockGradientDir}, ${formStyle.blockGradientFrom}, ${formStyle.blockGradientTo})` }} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Direction</label>
                          <select value={formStyle.blockGradientDir} onChange={e => setFormStyle(s => ({ ...s, blockGradientDir: e.target.value }))} className="w-full border rounded p-2">
                            <option value="to right">Left → Right</option>
                            <option value="to left">Right → Left</option>
                            <option value="to bottom">Top → Bottom</option>
                            <option value="to top">Bottom → Top</option>
                            <option value="135deg">Diagonal</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-heading">Font Color</h3>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formStyle.fontColor} onChange={e => setFormStyle(s => ({ ...s, fontColor: e.target.value }))} className="w-10 h-10 rounded-full border-2 border-border shadow" />
                      <span className="text-sm text-muted">Preview</span>
                      <span className="inline-block w-8 h-8 rounded-full border border-border" style={{ background: formStyle.fontColor }} />
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowStyleModal(false)}
                    className="px-6 py-2.5 bg-primary text-white rounded-full font-bold shadow hover:bg-primary/90 transition-all text-base"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
          {showTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto shadow-lg">
                <h3 className="text-lg font-bold mb-4">Choose a Template</h3>
                <div className="flex flex-col gap-4">
                  {FORM_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={tpl.name}
                      onClick={() => handleTemplateSelect(idx)}
                      className="px-4 py-3 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold text-left"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="mt-6 px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'text': return '📝';
    case 'email': return '📧';
    case 'phone': return '📞';
    case 'select': return '📋';
    case 'radio': return '🔘';
    case 'checkbox': return '☑️';
    case 'textarea': return '📄';
    case 'date': return '📅';
    case 'file': return '📎';
    default: return '❓';
  }
};

const FormPreview: React.FC<{ blocks: Block[]; questions: Question[]; media: { type: 'image' | 'video' | 'embed' | ''; url: string; primaryText?: string; secondaryText?: string } }> = ({ blocks, questions, media }) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [submitted, setSubmitted] = useState(false);

  if (blocks.length === 0) {
    return <div className="p-8 text-center text-gray-500">No blocks to preview.</div>;
  }

  const block = blocks[currentBlockIndex] || blocks[0];
  const blockQuestions = questions.filter(q => q.blockId === block?.id) || [];
  const question = blockQuestions[currentQuestionIndex] || blockQuestions[0];
  if (!block || !question) {
    return <div className="p-8 text-center text-error">Form preview data is missing or invalid.</div>;
  }

  // Find the next question index based on logic
  const getNextQuestionIndex = (selectedOption?: string) => {
    if (!question) return currentQuestionIndex + 1;
    if (question.conditionalLogic && selectedOption) {
      const logic = question.conditionalLogic.find(l => l.option === selectedOption);
      if (logic && logic.targetBlockId) {
        const idx = blockQuestions.findIndex(q => q.id === logic.targetBlockId);
        if (idx !== -1) return idx;
      }
    }
    return currentQuestionIndex + 1;
  };

  const handleNext = (selectedOption?: string) => {
    const nextIdx = getNextQuestionIndex(selectedOption);
    if (nextIdx < blockQuestions.length) {
      setCurrentQuestionIndex(nextIdx);
    } else if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
      const prevBlockQuestions = questions.filter(q => q.blockId === blocks[currentBlockIndex - 1]?.id) || [];
      setCurrentQuestionIndex(Math.max(0, prevBlockQuestions.length - 1));
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Thank you for your submission!</h2>
        <p className="text-gray-700">We have received your response.</p>
      </div>
    );
  }

  // If last block and last question, show submit button
  const isLastBlock = currentBlockIndex === blocks.length - 1;
  const isLastQuestion = currentQuestionIndex === blockQuestions.length - 1;

  return (
    <div className="p-6 max-w-lg mx-auto w-full">
      {media.url && (
        <div
          className="w-full relative flex justify-center items-center mb-6 overflow-hidden"
          style={media.type === 'image' ? { minHeight: '200px', backgroundImage: `url(${media.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { minHeight: '200px' }}
        >
          {media.type === 'video' && (
            <video src={media.url} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0" />
          )}
          {media.type === 'embed' && (
            <iframe src={media.url} title="Embedded Media" className="absolute inset-0 w-full h-full object-cover z-0" allowFullScreen />
          )}
          {/* Overlayed Texts */}
          <div className="absolute inset-0 flex flex-col justify-center items-center z-10 text-white text-center px-4">
            {media.primaryText && <div className="font-bold text-2xl md:text-3xl drop-shadow-lg mb-2">{media.primaryText}</div>}
            {media.secondaryText && <div className="text-base md:text-lg drop-shadow-md opacity-90">{media.secondaryText}</div>}
          </div>
          {/* Fallback for image (for accessibility) */}
          {media.type === 'image' && <img src={media.url} alt="Form Media" className="invisible w-full h-full object-cover absolute inset-0" />}
        </div>
      )}
      <h2 className="text-xl font-bold mb-4 text-center">{block.title}</h2>
      <div className="mb-6">
        <div className="mb-2 text-lg font-medium">{question.label} {question.required && <span className="text-red-500">*</span>}</div>
        {question.helpText && <div className="mb-2 text-gray-500 text-sm">{question.helpText}</div>}
        {(() => {
          switch (question.type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'date':
            case 'file':
              return (
                <input
                  type={question.type === 'phone' ? 'tel' : question.type}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-2"
                  value={answers[question.id] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [question.id]: e.target.value }))}
                  disabled={false}
                />
              );
            case 'textarea':
              return (
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg mb-2"
                  value={answers[question.id] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [question.id]: e.target.value }))}
                  rows={4}
                  disabled={false}
                />
              );
            case 'select':
              return (
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg mb-2"
                  value={answers[question.id] || ''}
                  onChange={e => {
                    setAnswers(a => ({ ...a, [question.id]: e.target.value }));
                  }}
                >
                  <option value="">Select...</option>
                  {(question.options || []).map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              );
            case 'radio':
              return (
                <div className="space-y-2">
                  {(question.options || []).map((opt, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={question.id}
                        value={opt}
                        checked={answers[question.id] === opt}
                        onChange={e => setAnswers(a => ({ ...a, [question.id]: opt }))}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              );
            case 'checkbox':
              return (
                <div className="space-y-2">
                  {(question.options || []).map((opt, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name={question.id}
                        value={opt}
                        checked={Array.isArray(answers[question.id]) && answers[question.id].includes(opt)}
                        onChange={e => {
                          setAnswers(a => {
                            const prev = Array.isArray(a[question.id]) ? a[question.id] : [];
                            if (e.target.checked) {
                              return { ...a, [question.id]: [...prev, opt] };
                            } else {
                              return { ...a, [question.id]: prev.filter((v: string) => v !== opt) };
                            }
                          });
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              );
            default:
              return null;
          }
        })()}
      </div>
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={currentBlockIndex === 0 && currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        {isLastBlock && isLastQuestion ? (
          <button
            type="button"
            className="w-full ml-4 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
            onClick={() => setSubmitted(true)}
          >
            Submit
          </button>
        ) : (
          ['select', 'radio'].includes(question.type) ? (
            <button
              onClick={() => handleNext(answers[question.id])}
              disabled={question.required && !answers[question.id]}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => handleNext()}
              disabled={question.required && !answers[question.id]}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          )
        )}
      </div>
    </div>
  );
};

const CopyShareableLinkButton: React.FC<{ lastSavedFormId: string | null }> = ({ lastSavedFormId }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.origin + '/share/form/' + (lastSavedFormId || '12345');

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${copied ? 'bg-green-700 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
      style={{ position: 'relative' }}
    >
      {copied ? 'Link Copied!' : 'Copy Shareable Link'}
    </button>
  );
};

export default FormBuilder; 