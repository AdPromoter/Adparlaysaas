import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';

// Custom CSS for handles
const handleStyle = {
  width: '12px',
  height: '12px',
  background: '#3B82F6',
  border: '2px solid white',
  borderRadius: '50%',
  cursor: 'crosshair',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const inputHandleStyle = {
  ...handleStyle,
  background: '#10B981',
};

interface QuestionData {
  type: 'text' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'date' | 'file';
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[];
}

interface FormNode extends Node {
  data: QuestionData;
}

type FormEdge = Edge & {
  data?: {
    condition: string;
    action: string;
  };
};

const QuestionNode: React.FC<{ data: QuestionData; id: string }> = ({ data, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(data);
  const { setNodes } = useReactFlow();

  const handleSave = () => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: localData } : node
      )
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalData(data);
    setIsEditing(false);
  };

  const addOption = () => {
    const newOptions = [...(localData.options || []), `Option ${(localData.options?.length || 0) + 1}`];
    setLocalData({ ...localData, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = localData.options?.filter((_, i) => i !== index);
    setLocalData({ ...localData, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(localData.options || [])];
    newOptions[index] = value;
    setLocalData({ ...localData, options: newOptions });
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      text: '📝',
      email: '📧',
      phone: '📞',
      select: '📋',
      radio: '🔘',
      checkbox: '☑️',
      textarea: '📄',
      date: '📅',
      file: '📎'
    };
    return icons[type] || '❓';
  };

  if (isEditing) {
    return (
      <div className="bg-white border-2 border-blue-500 rounded-xl p-6 shadow-xl min-w-[350px] animate-in slide-in-from-top-2 duration-300">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{getTypeIcon(localData.type)}</span>
            <h3 className="text-lg font-semibold text-gray-800">Edit Question</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
            <select
              value={localData.type}
              onChange={(e) => setLocalData({ ...localData, type: e.target.value as any })}
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
              value={localData.label}
              onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your question..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Help Text (Optional)</label>
            <input
              type="text"
              value={localData.helpText || ''}
              onChange={(e) => setLocalData({ ...localData, helpText: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Add helpful text for users..."
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={localData.required}
              onChange={(e) => setLocalData({ ...localData, required: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Required field</span>
          </div>

          {(localData.type === 'select' || localData.type === 'radio' || localData.type === 'checkbox') && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Options</label>
              <div className="space-y-2">
                {localData.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="w-full p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border-2 border-dashed border-blue-300 hover:border-blue-400"
                >
                  ➕ Add Option
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg min-w-[280px] cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 relative group">
      {/* Input handle for connections */}
      <Handle
        type="target"
        position={Position.Left}
        style={inputHandleStyle}
      />
      
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getTypeIcon(data.type)}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium bg-gray-100 px-2 py-1 rounded-full">
                {data.type}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight">{data.label}</h3>
            {data.helpText && (
              <p className="text-sm text-gray-600 mt-2 italic">💡 {data.helpText}</p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-blue-600 text-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            ✏️
          </button>
        </div>

        {data.required && (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium">
            ⚠️ Required
          </span>
        )}

        {(data.type === 'select' || data.type === 'radio' || data.type === 'checkbox') && data.options && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium">Options:</div>
            {data.options.map((option, index) => (
              <div key={index} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                {option}
              </div>
            ))}
          </div>
        )}

        {/* Connection ports for options */}
        {(data.type === 'select' || data.type === 'radio' || data.type === 'checkbox') && data.options && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2 font-medium">🔗 Connect options:</div>
            <div className="space-y-2">
              {data.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${id}-option-${index}`}
                    style={handleStyle}
                  />
                  <span className="text-xs text-gray-600 flex-1">{option}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default output handle for non-option questions */}
        {(!data.options || data.options.length === 0) && (
          <Handle
            type="source"
            position={Position.Right}
            id={`${id}-default`}
            style={handleStyle}
          />
        )}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  questionNode: QuestionNode,
};

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        data: {
          condition: 'default',
          action: 'show',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addQuestion = () => {
    const newNode: FormNode = {
      id: `question-${Date.now()}`,
      type: 'questionNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        type: 'text',
        label: 'New Question',
        helpText: '',
        required: false,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowWelcome(false);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const exportForm = () => {
    const formData = {
      nodes: nodes.map(node => ({
        id: node.id,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: edge.data,
      })),
    };
    console.log('Form Data:', formData);
    localStorage.setItem('formBuilderData', JSON.stringify(formData));
    
    // Show success message
    alert('Form saved successfully! 🎉');
    navigate('/dashboard');
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  };

  // Mobile List View
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">🎨 Form Builder</h1>
                <p className="text-gray-600">Create beautiful forms with ease</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={addQuestion}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
              >
                ➕ Add Question
              </button>
              <button
                onClick={exportForm}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
              >
                💾 Save Form
              </button>
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-4 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                <span>📝 Questions: {nodes.length}</span>
                <span>🔗 Connections: {edges.length}</span>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {nodes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <div className="text-8xl mb-6">🎨</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Building Your Form</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Create your first question to begin building an amazing form experience
                </p>
                <button
                  onClick={addQuestion}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
                >
                  Create First Question
                </button>
              </div>
            ) : (
              nodes.map((question, questionIndex) => {
                const getConnectionForOption = (optionIndex: number) => {
                  return edges.find(edge => 
                    edge.source === question.id && 
                    edge.sourceHandle === `${question.id}-option-${optionIndex}`
                  );
                };

                const getDefaultConnection = () => {
                  return edges.find(edge => 
                    edge.source === question.id && 
                    edge.sourceHandle === `${question.id}-default`
                  );
                };

                const updateConnection = (sourceId: string, targetId: string, condition: string) => {
                  setEdges(eds => eds.filter(edge => edge.source !== sourceId));
                  
                  if (targetId) {
                    const newEdge: Edge = {
                      id: `edge-${Date.now()}`,
                      source: sourceId,
                      target: targetId,
                      sourceHandle: condition === 'default' ? `${sourceId}-default` : undefined,
                      data: {
                        condition,
                        action: 'show',
                      },
                    };
                    setEdges(eds => [...eds, newEdge]);
                  }
                };

                const getTypeIcon = (type: string) => {
                  const icons: { [key: string]: string } = {
                    text: '📝',
                    email: '📧',
                    phone: '📞',
                    select: '📋',
                    radio: '🔘',
                    checkbox: '☑️',
                    textarea: '📄',
                    date: '📅',
                    file: '📎'
                  };
                  return icons[type] || '❓';
                };

                return (
                  <div key={question.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getTypeIcon(question.data.type)}</span>
                          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium bg-gray-100 px-3 py-1 rounded-full">
                            {question.data.type}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg">{question.data.label}</h3>
                        {question.data.helpText && (
                          <p className="text-sm text-gray-600 mt-2 italic">💡 {question.data.helpText}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">
                          Edit
                        </button>
                        <button
                          onClick={() => deleteNode(question.id)}
                          className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {question.data.required && (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium mb-4">
                        ⚠️ Required
                      </span>
                    )}

                    {/* Logic Connections */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      {(question.data.type === 'select' || question.data.type === 'radio' || question.data.type === 'checkbox') && question.data.options ? (
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            🔗 Option Logic
                          </h4>
                          {question.data.options.map((option: string, index: number) => {
                            const connection = getConnectionForOption(index);
                            return (
                              <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200 font-medium">
                                  "{option}"
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600 font-medium">If user selects this, then go to:</span>
                                  <select
                                    value={connection?.target || ''}
                                    onChange={(e) => updateConnection(
                                      question.id,
                                      e.target.value,
                                      option
                                    )}
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                  >
                                    <option value="">Select question...</option>
                                    {nodes
                                      .filter(q => q.id !== question.id)
                                      .map(q => (
                                        <option key={q.id} value={q.id}>
                                          {q.data.label}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            🔗 Default Logic
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 font-medium">After this question, go to:</span>
                            <select
                              value={getDefaultConnection()?.target || ''}
                              onChange={(e) => updateConnection(
                                question.id,
                                e.target.value,
                                'default'
                              )}
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                            >
                              <option value="">Select question...</option>
                              {nodes
                                .filter(q => q.id !== question.id)
                                .map(q => (
                                  <option key={q.id} value={q.id}>
                                    {q.data.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Canvas View
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="h-full">
        <ReactFlowProvider>
          <div className="h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={handleNodeClick}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#94a3b8" gap={20} />
              <Controls className="bg-white rounded-lg shadow-lg border border-gray-200" />
              <MiniMap className="bg-white rounded-lg shadow-lg border border-gray-200" />
              
              <Panel position="top-left" className="bg-white rounded-2xl shadow-xl p-6 m-4 border border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🎨</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Visual Form Builder</h2>
                      <p className="text-sm text-gray-600">Create forms with drag & drop</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={addQuestion}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    ➕ Add Question
                  </button>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">💡 Quick Tips:</h3>
                    <ul className="text-xs text-gray-600 space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Click "Add Question" to create tiles
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Drag tiles to reposition
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Click edit icon to configure
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Drag from blue dots to connect
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Use mouse wheel to zoom
                      </li>
                    </ul>
                  </div>
                </div>
              </Panel>

              <Panel position="top-right" className="bg-white rounded-2xl shadow-xl p-6 m-4 border border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Actions</h3>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={exportForm}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                    >
                      💾 Save Form
                    </button>
                    
                    {selectedNode && (
                      <button
                        onClick={() => deleteNode(selectedNode)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                      >
                        🗑️ Delete Selected
                      </button>
                    )}
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📝 Questions: <span className="font-semibold text-gray-800">{nodes.length}</span></p>
                      <p>🔗 Connections: <span className="font-semibold text-gray-800">{edges.length}</span></p>
                    </div>
                  </div>
                </div>
              </Panel>

              {showWelcome && nodes.length === 0 && (
                <Panel position="center" className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 max-w-md">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Form Builder!</h3>
                    <p className="text-gray-600 mb-6">
                      Start creating your form by adding your first question. You can drag tiles around and connect them to create conditional logic.
                    </p>
                    <button
                      onClick={() => setShowWelcome(false)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                    >
                      Get Started
                    </button>
                  </div>
                </Panel>
              )}

              <Panel position="bottom-left" className="bg-white rounded-2xl shadow-xl p-6 m-4 border border-gray-200">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">📊 Form Preview</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>This form will have <span className="font-semibold text-gray-800">{nodes.length}</span> questions</p>
                    <p>With <span className="font-semibold text-gray-800">{edges.length}</span> conditional connections</p>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default FormBuilder; 