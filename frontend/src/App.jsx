import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderGit2, 
  Terminal, 
  Bot, 
  Wand2, 
  FolderPlus, 
  Trash2, 
  ChevronRight, 
  FileText, 
  Folder, 
  Cpu, 
  Compass, 
  User, 
  Send, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  Search,
  Code
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  
  // Project Manager State
  const [newProjName, setNewProjName] = useState('');
  const [newProjPath, setNewProjPath] = useState('');
  const [projError, setProjError] = useState('');
  const [projSuccess, setProjSuccess] = useState('');

  // Project Analyzer State
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [openFile, setOpenFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Patel Chat State
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Code Generator State
  const [genModelName, setGenModelName] = useState('');
  const [genFields, setGenFields] = useState([{ name: '', type: 'string', nullable: false }]);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [genError, setGenError] = useState('');

  // Backend Health Checks
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    checkBackendHealth();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find(p => p.id == selectedProjectId);
      setCurrentProject(proj);
      analyzeProject(selectedProjectId);
      fetchConversations(selectedProjectId);
    } else {
      setCurrentProject(null);
      setAnalysis(null);
    }
    setOpenFile(null);
    setGenResult(null);
  }, [selectedProjectId, projects]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (res.status === 200 || res.status === 404 || res.status === 500) {
        setBackendOnline(true);
      }
    } catch (e) {
      setBackendOnline(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching projects", e);
    }
  };

  const importProject = async (e) => {
    e.preventDefault();
    setProjError('');
    setProjSuccess('');

    if (!newProjName || !newProjPath) {
      setProjError('Please enter both name and absolute path');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name: newProjName, path: newProjPath })
      });

      const data = await res.json();
      if (!res.ok) {
        setProjError(data.message || 'Failed to import project');
      } else {
        setProjSuccess('Project imported successfully!');
        setNewProjName('');
        setNewProjPath('');
        fetchProjects();
        setSelectedProjectId(data.id);
      }
    } catch (e) {
      setProjError('Connection to backend failed');
    }
  };

  const deleteProject = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this project?')) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProjects();
        if (selectedProjectId == id) {
          setSelectedProjectId('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const analyzeProject = async (id) => {
    setLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const res = await fetch(`${API_BASE}/projects/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ project_id: id })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchFileContent = async (absolutePath) => {
    setFileLoading(true);
    setOpenFile(null);
    try {
      const res = await fetch(`${API_BASE}/projects/file-content`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ path: absolutePath })
      });
      if (res.ok) {
        const data = await res.json();
        setOpenFile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFileLoading(false);
    }
  };

  const fetchConversations = async (projId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations?project_id=${projId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0) {
          setActiveConvId(data[0].id);
        } else {
          setActiveConvId('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createNewChat = async () => {
    if (!selectedProjectId) return;
    const title = `Chat ${conversations.length + 1}`;
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ title, project_id: selectedProjectId })
      });
      if (res.ok) {
        const data = await res.json();
        setConversations([data, ...conversations]);
        setActiveConvId(data.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeConvId) return;

    const messageText = chatInput;
    setChatInput('');
    setChatLoading(true);

    setMessages(prev => [...prev, { sender: 'user', content: messageText }]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: activeConvId,
          project_context: analysis ? {
            stack: analysis.stack,
            project_path: analysis.project_path,
            routes: analysis.routes,
            controllers: analysis.controllers,
            models: analysis.models
          } : null,
          current_file: openFile ? {
            path: openFile.path,
            content: openFile.content
          } : null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { sender: 'patel', content: data.content }]);
      } else {
        setMessages(prev => [...prev, { sender: 'patel', content: '❌ Error: Failed to generate response.' }]);
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [...prev, { sender: 'patel', content: `❌ Error: ${e.message || 'Connection to backend failed.'}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const addGenField = () => {
    setGenFields([...genFields, { name: '', type: 'string', nullable: false }]);
  };

  const removeGenField = (index) => {
    const updated = [...genFields];
    updated.splice(index, 1);
    setGenFields(updated);
  };

  const handleGenFieldChange = (index, key, val) => {
    const updated = [...genFields];
    updated[index][key] = val;
    setGenFields(updated);
  };

  const handleGenerateCrud = async (e) => {
    e.preventDefault();
    setGenError('');
    setGenResult(null);
    setGenLoading(true);

    if (!selectedProjectId) {
      setGenError('Please select a project first');
      setGenLoading(false);
      return;
    }

    if (!genModelName) {
      setGenError('Model Name is required');
      setGenLoading(false);
      return;
    }

    const invalidField = genFields.find(f => !f.name);
    if (invalidField) {
      setGenError('All field names must be filled');
      setGenLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/generate-crud`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          project_id: selectedProjectId,
          model_name: genModelName,
          fields: genFields
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGenResult(data);
        setGenModelName('');
        setGenFields([{ name: '', type: 'string', nullable: false }]);
        analyzeProject(selectedProjectId);
      } else {
        setGenError(data.message || 'Failed to generate CRUD');
      }
    } catch (e) {
      setGenError('Backend generation request failed');
    } finally {
      setGenLoading(false);
    }
  };

  const FileTreeNode = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const isDir = item.type === 'directory';

    const handleClick = () => {
      if (isDir) {
        setExpanded(!expanded);
      } else {
        const absolutePath = analysis.project_path + '/' + item.relative_path;
        fetchFileContent(absolutePath);
      }
    };

    return (
      <div style={{ paddingLeft: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
        <div 
          onClick={handleClick}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '4px 8px', 
            borderRadius: '6px', 
            cursor: 'pointer',
            transition: 'background 0.2s',
            color: isDir ? '#f59e0b' : '#94a3b8'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {isDir ? <Folder size={14} /> : <FileText size={14} />}
          <span>{item.name}</span>
        </div>
        {isDir && expanded && item.children && (
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.05)', marginLeft: '8px' }}>
            {item.children.map((child, i) => (
              <FileTreeNode key={i} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-layout">
      
      {/* SIDEBAR */}
      <div className="sidebar">
        <div>
          {/* Logo Section */}
          <div className="logo-section">
            <div className="logo-badge">
              <Cpu size={22} />
            </div>
            <div>
              <h1 className="logo-title">Developer OS</h1>
              <span className="logo-subtitle">Assistant: Patel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="nav-list">
            <button 
              onClick={() => setActiveTab('projects')}
              className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            >
              <FolderGit2 size={16} />
              <span>Project Manager</span>
            </button>

            <button 
              onClick={() => setActiveTab('analyzer')}
              className={`nav-item ${activeTab === 'analyzer' ? 'active' : ''}`}
            >
              <Compass size={16} />
              <span>Project Analyzer</span>
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            >
              <Bot size={16} />
              <span>Patel Chat</span>
            </button>

            <button 
              onClick={() => setActiveTab('generator')}
              className={`nav-item ${activeTab === 'generator' ? 'active' : ''}`}
            >
              <Wand2 size={16} />
              <span>Code Generator</span>
            </button>
          </nav>
        </div>

        {/* Status Indicators */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div className="status-badge" style={{ marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Backend Server</span>
            <span style={{ color: backendOnline ? '#10b981' : '#ef4444' }}>
              <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
              {backendOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
            Local Dev OS @ Port 8000
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="main-container">
        
        {/* HEADER */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Active Project:</span>
            <select 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="glass-input"
              style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="">-- Select or Import Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            {currentProject && (
              <span className="font-mono" style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(99, 102, 241, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                {currentProject.path}
              </span>
            )}
          </div>
        </header>

        {/* CONTENT PANELS */}
        <main className="content-pane">
          
          {/* TAB: PROJECTS */}
          {activeTab === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
                  <FolderPlus style={{ color: '#818cf8' }} size={20} />
                  Import / Register Local Project
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 20px 0' }}>
                  Import any Laravel or React folder located on your local drive. Developer OS will read directories and hook up our AI assistant Patel.
                </p>

                <form onSubmit={importProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Project Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Laravel App"
                        value={newProjName}
                        onChange={(e) => setNewProjName(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Absolute Local Path</label>
                      <input 
                        type="text" 
                        placeholder="e.g. c:/xampp/htdocs/app"
                        value={newProjPath}
                        onChange={(e) => setNewProjPath(e.target.value)}
                        className="glass-input font-mono"
                      />
                    </div>
                  </div>

                  {projError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
                      <AlertCircle size={16} />
                      <span>{projError}</span>
                    </div>
                  )}

                  {projSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} />
                      <span>{projSuccess}</span>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
                    Import Project
                  </button>
                </form>
              </div>

              {/* Projects List */}
              <div className="glass-panel">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0' }}>Your Registered Workspaces</h3>
                {projects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '0.9rem' }}>
                    No projects registered yet. Use the form above to import your local workspace directory.
                  </div>
                ) : (
                  <div className="card-grid">
                    {projects.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className="glass-card"
                        style={{ borderColor: selectedProjectId == p.id ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.04)', background: selectedProjectId == p.id ? 'rgba(99,102,241,0.04)' : '' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontWeight: 700, color: 'white' }}>{p.name}</h4>
                          <button 
                            onClick={(e) => deleteProject(p.id, e)}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="font-mono text-glow" style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: PROJECT ANALYZER */}
          {activeTab === 'analyzer' && (
            <div style={{ height: '100%' }}>
              {!selectedProjectId ? (
                <div className="glass-panel" style={{ textAlign: 'center', color: '#94a3b8' }}>
                  Please select a project in the top header selector to analyze its directories.
                </div>
              ) : loadingAnalysis ? (
                <div className="glass-panel" style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #6366f1', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
                  Analyzing directory structure...
                </div>
              ) : !analysis ? (
                <div className="glass-panel" style={{ textAlign: 'center', color: '#94a3b8' }}>
                  Failed to load project details. Verify if directory still exists.
                </div>
              ) : (
                <div className="analyzer-grid">
                  
                  {/* File Explorer */}
                  <div className="file-explorer">
                    <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Folder size={14} />
                      File Explorer
                    </h3>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {analysis.file_tree.map((item, idx) => (
                        <FileTreeNode key={idx} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* Right Details Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
                    
                    {/* Stat Metrics */}
                    <div className="glass-panel" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', display: 'block' }}>Stack</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{analysis.stack.join(' + ')}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', display: 'block' }}>Controllers</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{analysis.controllers.length}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', display: 'block' }}>Models</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{analysis.models.length}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', display: 'block' }}>Routes</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{analysis.routes.length}</span>
                      </div>
                    </div>

                    {/* Code Preview */}
                    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Code size={14} />
                          Code Preview
                        </h4>
                        {openFile && (
                          <span className="font-mono" style={{ fontSize: '0.7rem', color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                            {basename(openFile.path)}
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '12px', color: '#cbd5e1' }}>
                        {fileLoading ? (
                          <div style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>Loading file content...</div>
                        ) : openFile ? (
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{openFile.content}</pre>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>Select a file from the explorer to preview code.</div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB: PATEL CHAT */}
          {activeTab === 'chat' && (
            <div className="chat-layout">
              
              {/* Sidebar list */}
              <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
                <div>
                  <button 
                    onClick={createNewChat} 
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
                  >
                    <Plus size={14} />
                    New Chat
                  </button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Sessions</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {conversations.map((c) => (
                      <button 
                        key={c.id} 
                        onClick={() => setActiveConvId(c.id)}
                        style={{ 
                          width: '100%', 
                          textAlign: 'left', 
                          padding: '8px 12px', 
                          border: 'none', 
                          borderRadius: '8px', 
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          background: activeConvId == c.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                          color: activeConvId == c.id ? '#818cf8' : '#94a3b8'
                        }}
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Main Window */}
              <div className="chat-window">
                <div className="chat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={18} style={{ color: '#818cf8' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Patel AI</span>
                  </div>
                  {openFile && (
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active File: {basename(openFile.path)}</span>
                  )}
                </div>

                {/* Messages */}
                <div className="messages-list">
                  {messages.map((msg, i) => (
                    <div key={i} className={`message-bubble ${msg.sender === 'user' ? 'user' : 'patel'}`}>
                      <div className={`avatar ${msg.sender === 'user' ? 'user' : 'patel'}`}>
                        {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className="bubble-content">
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{msg.content}</pre>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="message-bubble patel">
                      <div className="avatar patel">
                        <Bot size={14} />
                      </div>
                      <div className="bubble-content" style={{ color: '#64748b', fontStyle: 'italic' }}>
                        Patel is typing...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input box */}
                <form onSubmit={sendChatMessage} className="chat-input-bar">
                  <input 
                    type="text" 
                    placeholder="Ask Patel to explain codebase, controllers, or generate migrations..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={!activeConvId}
                    className="glass-input"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }} disabled={!activeConvId || chatLoading}>
                    <Send size={14} />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB: CODE GENERATOR */}
          {activeTab === 'generator' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
                  <Wand2 style={{ color: '#818cf8' }} size={20} />
                  AI CRUD Generator
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 20px 0' }}>
                  Quickly generate database migration schemas, fillable models, API resource controllers, and register their web/API routes instantly.
                </p>

                <form onSubmit={handleGenerateCrud} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group" style={{ maxWidth: '300px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Model Name (Singular)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Order"
                      value={genModelName}
                      onChange={(e) => setGenModelName(e.target.value)}
                      className="glass-input"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Model Fields</label>
                    
                    {genFields.map((field, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input 
                          type="text" 
                          placeholder="Field name (e.g. title)"
                          value={field.name}
                          onChange={(e) => handleGenFieldChange(idx, 'name', e.target.value)}
                          className="glass-input"
                          style={{ maxWidth: '180px' }}
                        />

                        <select 
                          value={field.type} 
                          onChange={(e) => handleGenFieldChange(idx, 'type', e.target.value)}
                          className="glass-input"
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <option value="string">String (varchar)</option>
                          <option value="integer">Integer (int)</option>
                          <option value="text">Text (longtext)</option>
                          <option value="boolean">Boolean</option>
                          <option value="double">Double / Decimal</option>
                          <option value="date">Date</option>
                        </select>

                        <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#94a3b8' }}>
                          <input 
                            type="checkbox"
                            checked={field.nullable}
                            onChange={(e) => handleGenFieldChange(idx, 'nullable', e.target.checked)}
                          />
                          Nullable
                        </label>

                        {genFields.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeGenField(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}

                    <button 
                      type="button" 
                      onClick={addGenField}
                      style={{ background: 'transparent', border: 'none', color: '#818cf8', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '6px 0', width: 'fit-content' }}
                    >
                      <Plus size={14} /> Add Field
                    </button>
                  </div>

                  {genError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', maxWidth: '500px' }}>
                      <AlertCircle size={16} />
                      <span>{genError}</span>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={genLoading || !selectedProjectId}>
                    {genLoading ? 'Generating CRUD...' : 'Generate CRUD'}
                  </button>
                </form>
              </div>

              {/* Generation results */}
              {genResult && (
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ color: '#34d399', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>CRUD successfully generated!</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <div>
                      <strong style={{ color: 'white' }}>Migration: </strong>
                      <span className="font-mono">{genResult.files.migration.path}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'white' }}>Model: </strong>
                      <span className="font-mono">{genResult.files.model.path}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'white' }}>Controller: </strong>
                      <span className="font-mono">{genResult.files.controller.path}</span>
                    </div>
                    {genResult.route_added && (
                      <div style={{ color: '#818cf8', fontWeight: 600 }}>
                        ✓ Registered API Resource route in routes/api.php
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

    </div>
  );
}

function basename(path) {
  if (!path) return '';
  return path.split(/[\\/]/).pop();
}
