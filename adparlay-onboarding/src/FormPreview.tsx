import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFirebase } from './FirebaseContext';
import { toPng } from 'html-to-image';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const FormPreview: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { saveFormResponse } = useFirebase();
  const summaryRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchForm = async () => {
      if (formId) {
        // Try localStorage first (optional, for backward compatibility)
        let foundForm = null;
        const forms = JSON.parse(localStorage.getItem('forms') || '[]');
        foundForm = forms.find((f: any) => f.id === formId);
        // If not found in localStorage, fetch from Firestore
        if (!foundForm) {
          try {
            const formDoc = await getDoc(doc(db, 'forms', formId));
            if (formDoc.exists()) {
              foundForm = { id: formDoc.id, ...formDoc.data() };
            }
          } catch (e) {
            console.error('Failed to fetch form from Firestore:', e);
          }
        }
        setForm(foundForm);
      }
      setLoading(false);
    };
    fetchForm();
  }, [formId]);

  const handleDownloadImage = async () => {
    if (summaryRef.current) {
      try {
        const dataUrl = await toPng(summaryRef.current);
        const link = document.createElement('a');
        link.download = `${form?.title || 'Form'}-submission.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        alert('Could not generate image.');
      }
    }
  };

  useEffect(() => {
    if (submitted) {
      handleDownloadImage();
    }
    // eslint-disable-next-line
  }, [submitted]);

  if (loading) return <div>Loading...</div>;
  if (!form) return <div>Form not found</div>;
  if (!form.blocks || !form.questions) return <div>Invalid form data</div>;

  const blocks = form.blocks;
  const questions = form.questions;
  const media = form.media || {};

  const block = blocks[currentBlockIndex] || blocks[0];
  const blockQuestions = questions.filter((q: any) => q.blockId === block?.id) || [];
  const question = blockQuestions[currentQuestionIndex] || blockQuestions[0];

  // Helper to check if all required questions in the block are answered
  const allRequiredAnswered = blockQuestions.every((q: any) => {
    if (!q.required) return true;
    const val = answers[q.id];
    if (q.type === 'checkbox') return Array.isArray(val) && val.length > 0;
    return val && val !== '';
  });

  // Helper: Get next block index based on conditional logic
  const getNextBlockIndex = (question: any, selectedOption: string) => {
    if (question && question.conditionalLogic && Array.isArray(question.conditionalLogic)) {
      const logic = question.conditionalLogic.find((l: any) => l.option === selectedOption);
      if (logic && logic.targetBlockId) {
        const idx = blocks.findIndex((b: any) => b.id === logic.targetBlockId);
        if (idx !== -1) return idx;
      }
    }
    // Default: next block
    return currentBlockIndex + 1;
  };

  // Handler for next (with logic)
  const handleNext = () => {
    // Find the first radio/select question in the block with an answer
    const logicQuestion = blockQuestions.find((q: any) =>
      (q.type === 'radio' || q.type === 'select') && answers[q.id]
    );
    if (logicQuestion) {
      const selectedOption = answers[logicQuestion.id];
      // Check if this option has logic
      const logic = logicQuestion.conditionalLogic?.find((l: any) => l.option === selectedOption);
      if (logic && logic.targetBlockId) {
        const nextBlockIdx = blocks.findIndex((b: any) => b.id === logic.targetBlockId);
        if (nextBlockIdx !== -1 && nextBlockIdx < blocks.length) {
          setCurrentBlockIndex(nextBlockIdx);
          setCurrentQuestionIndex(0);
          return;
        }
      }
    }
    // Default: next block or submit
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      handleSubmit();
    }
  };

  // Handler for previous block
  const handlePrevBlock = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveFormResponse({ formId, formTitle: form.title, formData: answers });
      // Save to localStorage for dashboard
      const stored = localStorage.getItem('form_submissions');
      const submissions = stored ? JSON.parse(stored) : [];
      submissions.unshift({
        formId,
        formTitle: form.title,
        formData: answers,
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem('form_submissions', JSON.stringify(submissions));
      setSubmitted(true);
    } catch (error) {
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        {/* Hidden summary for image generation */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div
            ref={summaryRef}
            className="w-[370px] rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 overflow-hidden font-sans"
            style={{ fontFamily: 'Inter, Arial, sans-serif' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 py-4 px-6 flex items-center gap-3">
              <div className="bg-white rounded-full p-2 shadow text-green-500">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#22c55e"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="text-white text-xl font-bold flex-1 text-center">{form.title || 'Untitled Form'}</div>
            </div>
            {/* Answers */}
            <div className="p-6">
              <ul className="space-y-4">
                {Object.entries(answers).map(([key, value]) => {
                  const question = questions.find((q: any) => q.id === key);
                  if (!question) return null;
                  return (
                    <li key={key} className="flex items-start gap-3 border-b border-blue-100 pb-3 last:border-b-0">
                      <div className="mt-1 text-blue-500">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6"/><text x="12" y="16" textAnchor="middle" fontSize="14" fill="#fff" fontFamily="Arial">Q</text></svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-base mb-1">{question.label}</div>
                        <div className="text-gray-700 text-sm flex items-center gap-2">
                          <span className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-1 font-medium">
                            {Array.isArray(value) ? value.join(', ') : value}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="text-xs text-gray-400 text-center pb-3">Generated by Adparlay</div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-4">Thank you for your submission!</h2>
        <p className="text-gray-700">We have received your response.</p>
        <p className="text-gray-500 mt-4">A summary image of your submission has been downloaded.</p>
        {/* Call to action for sign up */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 bg-blue-50 rounded-xl p-6 max-w-md mx-auto shadow">
          <div className="text-lg font-semibold text-blue-900">Want to create interactive forms that convert leads?</div>
          <div className="text-blue-700 mb-2">Start generating leads in a more engaging way!</div>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition-all text-lg"
            onClick={() => window.location.href = '/'}
          >
            Start Generating Leads
          </button>
        </div>
      </div>
    );
  }

  // If last block and last question, show submit button
  const isLastBlock = currentBlockIndex === blocks.length - 1;
  const isLastQuestion = currentQuestionIndex === blockQuestions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed media at the top */}
      {media.url && (
        <div
          className="fixed top-0 left-0 w-full z-20 flex justify-center items-center bg-black"
          style={{ height: '40vh', minHeight: '220px', maxHeight: '60vh', background: media.type === 'image' ? `url(${media.url}) center/cover no-repeat` : '#222' }}
        >
          {media.type === 'video' && (
            <video src={media.url} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0" />
          )}
          {media.type === 'embed' && (
            <iframe src={media.url} title="Embedded Media" className="absolute inset-0 w-full h-full object-cover z-0" allowFullScreen />
          )}
          {/* Overlayed Texts */}
          <div className="absolute inset-0 flex flex-col justify-center items-center z-10 text-white text-center px-4 bg-black/30">
            {media.primaryText && <div className="font-bold text-2xl md:text-3xl drop-shadow-lg mb-2">{media.primaryText}</div>}
            {media.secondaryText && <div className="text-base md:text-lg drop-shadow-md opacity-90">{media.secondaryText}</div>}
          </div>
          {/* Fallback for image (for accessibility) */}
          {media.type === 'image' && <img src={media.url} alt="Form Media" className="invisible w-full h-full object-cover absolute inset-0" />}
        </div>
      )}
      {/* Form content below fixed media */}
      <div className="flex flex-col items-center justify-start pt-[44vh] pb-8 min-h-screen">
        <div className="p-6 max-w-lg w-full bg-white rounded-2xl shadow-xl mx-auto relative z-10">
          <h1 className="text-2xl font-extrabold text-center mb-6">{form.title || 'Untitled Form'}</h1>
          <h2 className="text-xl font-bold mb-4 text-center">{block.title}</h2>
          <form onSubmit={e => {
            e.preventDefault();
            handleNext();
          }}>
            <div className="mb-6 space-y-6">
              {blockQuestions.map((question: any) => (
                <div key={question.id} className="mb-4">
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
                              // If you want to auto-advance on select, uncomment:
                              // handleNext(question, e.target.value);
                            }}
                          >
                            <option value="">Select...</option>
                            {(question.options || []).map((opt: string, idx: number) => (
                              <option key={idx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        );
                      case 'radio':
                        return (
                          <div className="space-y-2">
                            {(question.options || []).map((opt: string, idx: number) => (
                              <label key={idx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={opt}
                                  checked={answers[question.id] === opt}
                                  onChange={e => {
                                    setAnswers(a => ({ ...a, [question.id]: opt }));
                                    // If you want to auto-advance on radio, uncomment:
                                    // handleNext(question, opt);
                                  }}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        );
                      case 'checkbox':
                        return (
                          <div className="space-y-2">
                            {(question.options || []).map((opt: string, idx: number) => (
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
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevBlock}
                disabled={currentBlockIndex === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="submit"
                className="w-full ml-4 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
                disabled={!allRequiredAnswered || submitting}
              >
                {isLastBlock ? (submitting ? 'Submitting...' : 'Submit') : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
