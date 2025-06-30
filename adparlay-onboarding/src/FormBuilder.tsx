import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    targetFormId?: string;
  }>;
}

interface Block {
  id: string;
  title: string;
  isEditing: boolean;
}

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Back to Dashboard Button */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          <span className="text-lg">←</span> Dashboard
        </button>
      </div>
      {showWelcome && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Form Builder</h1>
          <p className="text-gray-600 mb-8">Start building your form by adding a question block.</p>
          <button
            onClick={addBlock}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            ➕ Add Question Block
          </button>
        </div>
      )}

      {!showWelcome && (
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Form Builder</h1>
            <button
              onClick={addBlock}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Add Question Block
            </button>
          </div>

          <div className="space-y-8">
            {blocks.map(block => (
              <div key={block.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  {block.isEditing ? (
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => setBlocks(blocks.map(b => 
                        b.id === block.id ? { ...b, title: e.target.value } : b
                      ))}
                      className="w-full sm:w-auto text-xl font-semibold px-3 py-1 border rounded"
                      placeholder="Block Title"
                    />
                  ) : (
                    <h2 className="text-xl font-semibold">{block.title}</h2>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {block.isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveBlock(block.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Save Block
                        </button>
                        <button
                          onClick={() => addQuestionToBlock(block.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Edit Block
                        </button>
                        <button
                          onClick={() => {
                            setBlocks(blocks.filter(b => b.id !== block.id));
                            setQuestions(questions.filter(q => q.blockId !== block.id));
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
                      <div key={question.id} className="border rounded-lg p-4">
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
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

                            {(question.type === 'select' || question.type === 'radio' || question.type === 'checkbox') && (
                              <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Options</label>
                                <div className="space-y-2">
                                  {(question.options || []).map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                          const newOptions = [...(question.options || [])];
                                          newOptions[index] = e.target.value;
                                          setQuestions(questions.map(q => 
                                            q.id === question.id 
                                              ? { ...q, options: newOptions }
                                              : q
                                          ));
                                        }}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder={`Option ${index + 1}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setLogicModal({ questionId: question.id, optionIndex: index, blockId: question.blockId })}
                                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200 text-xs"
                                      >
                                        ➕ Add Logic
                                      </button>
                                      <button
                                        onClick={() => {
                                          const newOptions = (question.options || []).filter((_, i) => i !== index);
                                          setQuestions(questions.map(q => 
                                            q.id === question.id 
                                              ? { ...q, options: newOptions }
                                              : q
                                          ));
                                        }}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                                      setQuestions(questions.map(q => 
                                        q.id === question.id 
                                          ? { ...q, options: newOptions }
                                          : q
                                      ));
                                    }}
                                    className="w-full p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border-2 border-dashed border-blue-300 hover:border-blue-400"
                                  >
                                    ➕ Add Option
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl">{getTypeIcon(question.type)}</span>
                                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium bg-gray-100 px-3 py-1 rounded-full">
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
              </div>
            ))}
          </div>
          {/* Save Form Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setPreviewOpen(true)}
              className="px-8 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 text-lg font-bold transition-colors w-full max-w-xs"
            >
              💾 Save Form
            </button>
          </div>
          {logicModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50">
              <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md mx-auto shadow-lg animate-slideup">
                <h3 className="text-lg font-bold mb-4">Add Logic for Option</h3>
                <p className="mb-2 text-sm text-gray-700">When this option is selected, go to:</p>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                  value={selectedTarget}
                  onChange={e => setSelectedTarget(e.target.value)}
                >
                  <option value="">Select next question...</option>
                  {questions.filter(q => q.blockId === logicModal.blockId && q.id !== logicModal.questionId).map(q => (
                    <option key={q.id} value={q.id}>{q.label}</option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                    onClick={() => { setLogicModal(null); setSelectedTarget(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white font-bold"
                    disabled={!selectedTarget}
                    onClick={() => {
                      setQuestions(questions.map(q => {
                        if (q.id === logicModal.questionId) {
                          const newLogic = [...(q.conditionalLogic || [])];
                          newLogic[logicModal.optionIndex] = {
                            option: (q.options || [])[logicModal.optionIndex],
                            targetFormId: selectedTarget
                          };
                          return { ...q, conditionalLogic: newLogic };
                        }
                        return q;
                      }));
                      setLogicModal(null);
                      setSelectedTarget('');
                    }}
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
                <FormPreview blocks={blocks} questions={questions} />
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

const FormPreview: React.FC<{ blocks: Block[]; questions: Question[] }> = ({ blocks, questions }) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  if (blocks.length === 0) {
    return <div className="p-8 text-center text-gray-500">No blocks to preview.</div>;
  }

  const block = blocks[currentBlockIndex];
  const blockQuestions = questions.filter(q => q.blockId === block.id);
  const question = blockQuestions[currentQuestionIndex];

  // Find the next question index based on logic
  const getNextQuestionIndex = (selectedOption?: string) => {
    if (!question) return currentQuestionIndex + 1;
    if (question.conditionalLogic && selectedOption) {
      const logic = question.conditionalLogic.find(l => l.option === selectedOption);
      if (logic && logic.targetFormId) {
        const idx = blockQuestions.findIndex(q => q.id === logic.targetFormId);
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
      const prevBlockQuestions = questions.filter(q => q.blockId === blocks[currentBlockIndex - 1].id);
      setCurrentQuestionIndex(prevBlockQuestions.length - 1);
    }
  };

  if (!question) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Form Complete!</h2>
        <p className="text-gray-600">You have reached the end of the form preview.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto w-full">
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
        {['select', 'radio'].includes(question.type) ? (
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
        )}
      </div>
    </div>
  );
};

export default FormBuilder; 