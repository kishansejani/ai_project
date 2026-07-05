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
      // Auto analyze when project changes
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
        headers: { 'Content-Type': 'application/json' },
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
    if (!confirm('Are you sure you want to remove this project from Developer OS?')) return;
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

  // Chat APIs
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
        headers: { 'Content-Type': 'application/json' },
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

    // Optimistic Update
    setMessages(prev => [...prev, { sender: 'user', content: messageText }]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setMessages(prev => [...prev, { sender: 'patel', content: '❌ Error: Connection to backend failed.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Code Generator methods
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
        headers: { 'Content-Type': 'application/json' },
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
        // Re-analyze project so new files show up
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

  // Render Folder Tree Component
  const FileTreeNode = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const isDir = item.type === 'directory';

    const handleClick = () => {
      if (isDir) {
        setExpanded(!expanded);
      } else {
        // Fetch absolute path
        const absolutePath = analysis.project_path + '/' + item.relative_path;
        fetchFileContent(absolutePath);
      }
    };

    return (
      <div className="pl-3 font-mono text-sm">
        <div 
          onClick={handleClick}
          className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer select-none transition-colors ${isDir ? 'hover:bg-white/5' : 'hover:bg-indigo-500/10 text-slate-300'}`}
        >
          {isDir ? (
            <Folder size={15} className="text-yellow-500 fill-yellow-500/15" />
          ) : (
            <FileText size={15} className="text-indigo-400" />
          )}
          <span>{item.name}</span>
        </div>
        {isDir && expanded && item.children && (
          <div className="border-l border-white/5 ml-3">
            {item.children.map((child, i) => (
              <FileTreeNode key={i} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-200">
      
      {/* SIDEBAR */}
      <div className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between m-3 mr-0">
        <div>
          {/* Logo */}
          <div className="p-5 flex items-center gap-3 border-b border-white/5">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-xl bg-glow">
              <Cpu className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">Developer OS</h1>
              <span className="text-xs text-indigo-400 font-medium">Assistant: Patel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-lg bg-glow' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
            >
              <FolderGit2 size={18} />
              <span>Project Manager</span>
            </button>

            <button 
              onClick={() => setActiveTab('analyzer')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'analyzer' ? 'bg-indigo-600 text-white shadow-lg bg-glow' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
            >
              <Compass size={18} />
              <span>Project Analyzer</span>
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg bg-glow' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
            >
              <Bot size={18} />
              <span>Patel Chat</span>
            </button>

            <button 
              onClick={() => setActiveTab('generator')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'generator' ? 'bg-indigo-600 text-white shadow-lg bg-glow' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
            >
              <Wand2 size={18} />
              <span>Code Generator</span>
            </button>
          </nav>
        </div>

        {/* Status Indicators */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Backend Server</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={backendOnline ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                {backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 text-center">
            Local Dev OS @ Port 8000
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden m-3">
        
        {/* TOP NAVBAR / HEADER */}
        <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-6 mb-3">
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Active Project:</span>
            <select 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Select or Import Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {currentProject && (
              <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                {currentProject.path}
              </span>
            )}
          </div>
        </header>

        {/* CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto min-h-0">
          
          {/* TAB: PROJECT MANAGER */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="glass-panel p-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <FolderPlus className="text-indigo-400" />
                  Import / Register Local Project
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                  Import any Laravel or React folder located on your system. Developer OS will read directories and hook up our AI assistant Patel to explain and customize it.
                </p>

                <form onSubmit={importProject} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Project Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. My E-commerce Web"
                        value={newProjName}
                        onChange={(e) => setNewProjName(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Absolute Local Folder Path</label>
                      <input 
                        type="text" 
                        placeholder="e.g. c:/xampp/htdocs/other_project"
                        value={newProjPath}
                        onChange={(e) => setNewProjPath(e.target.value)}
                        className="glass-input font-mono text-sm"
                      />
                    </div>
                  </div>

                  {projError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      <AlertCircle size={16} />
                      <span>{projError}</span>
                    </div>
                  )}

                  {projSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                      <CheckCircle2 size={16} />
                      <span>{projSuccess}</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-indigo-500/25"
                  >
                    Import Project
                  </button>
                </form>
              </div>

              {/* Projects List */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-4">Your Projects</h3>
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No projects imported yet. Use the form above to register your first local workspace directory.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`p-4 glass-card cursor-pointer border ${selectedProjectId == p.id ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white">{p.name}</h4>
                          <button 
                            onClick={(e) => deleteProject(p.id, e)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <p className="text-xs font-mono text-slate-400 truncate mb-1">{p.path}</p>
                        <span className="text-[10px] text-slate-500">Registered: {new Date(p.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: PROJECT ANALYZER */}
          {activeTab === 'analyzer' && (
            <div className="h-full flex flex-col">
              {!selectedProjectId ? (
                <div className="glass-panel p-8 text-center text-slate-400">
                  Please select a project in the top header selector to analyze its directories.
                </div>
              ) : loadingAnalysis ? (
                <div className="glass-panel p-12 text-center text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4" />
                  Analyzing directory structures, controllers, models, and routes...
                </div>
              ) : !analysis ? (
                <div className="glass-panel p-8 text-center text-slate-400">
                  Failed to load project details. Verify if the directory still exists.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-[500px]">
                  
                  {/* File Tree (Col 4) */}
                  <div className="lg:col-span-3 glass-panel p-4 flex flex-col overflow-hidden">
                    <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-400 mb-3 flex items-center gap-2">
                      <Folder size={15} />
                      File Explorer
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-1">
                      {analysis.file_tree.map((item, idx) => (
                        <FileTreeNode key={idx} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* Analyzer Details & Code Preview (Col 9) */}
                  <div className="lg:col-span-9 flex flex-col gap-4">
                    
                    {/* Project Highlights / Dashboard stats */}
                    <div className="glass-panel p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Stack</span>
                        <span className="text-sm font-semibold text-white">{analysis.stack.join(' + ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Controllers</span>
                        <span className="text-sm font-semibold text-white">{analysis.controllers.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Models</span>
                        <span className="text-sm font-semibold text-white">{analysis.models.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Routes</span>
                        <span className="text-sm font-semibold text-white">{analysis.routes.length}</span>
                      </div>
                    </div>

                    {/* File Content Preview */}
                    <div className="glass-panel p-4 flex-1 flex flex-col overflow-hidden min-h-[350px]">
                      <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-400 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Code size={15} />
                          File Preview
                        </span>
                        {openFile && (
                          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {basename(openFile.path)}
                          </span>
                        )}
                      </h3>

                      <div className="flex-1 overflow-y-auto bg-black/30 border border-white/5 rounded-lg p-4 font-mono text-xs text-slate-300">
                        {fileLoading ? (
                          <div className="text-center py-12 text-slate-500">Loading file content...</div>
                        ) : openFile ? (
                          <pre className="whitespace-pre-wrap">{openFile.content}</pre>
                        ) : (
                          <div className="text-center py-12 text-slate-500">
                            Select a file from the explorer to view its code content.
                          </div>
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
            <div className="h-full flex gap-4 min-h-[500px]">
              
              {/* Chats List sidebar */}
              <div className="w-56 glass-panel p-4 flex flex-col justify-between overflow-hidden">
                <div>
                  <button 
                    onClick={createNewChat}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 rounded-xl text-sm font-medium transition-all mb-4"
                  >
                    <Plus size={16} />
                    New Conversation
                  </button>

                  <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">Previous Chats</h3>
                  <div className="space-y-1 overflow-y-auto max-h-[350px]">
                    {conversations.map((c) => (
                      <button 
                        key={c.id}
                        onClick={() => setActiveConvId(c.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${activeConvId == c.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'hover:bg-white/5 text-slate-400'}`}
                      >
                        {c.title}
                      </button>
                    ))}
                    {conversations.length === 0 && (
                      <div className="text-xs text-slate-600 text-center py-4">No chat sessions.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat View */}
              <div className="flex-1 glass-panel flex flex-col justify-between overflow-hidden">
                {/* Chat header */}
                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/10">
                  <div className="flex items-center gap-2">
                    <Bot className="text-indigo-400" />
                    <div>
                      <h3 className="font-bold text-white text-sm">Patel AI</h3>
                      <span className="text-[10px] text-green-400">Ready to assist</span>
                    </div>
                  </div>
                  {openFile && (
                    <span className="text-xs text-slate-400 font-mono max-w-[200px] truncate">
                      Context: {basename(openFile.path)}
                    </span>
                  )}
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className={`p-2 h-8 w-8 rounded-full flex items-center justify-center text-white ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div className={`rounded-2xl p-4 text-sm ${msg.sender === 'user' ? 'bg-indigo-600/90 text-white rounded-tr-none' : 'bg-white/5 border border-white/5 rounded-tl-none'}`}>
                        <pre className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3 mr-auto items-center">
                      <div className="p-2 h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 text-xs text-slate-400 animate-pulse">
                        Patel is generating a response...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input box */}
                <form onSubmit={sendChatMessage} className="p-4 border-t border-white/5 bg-black/10 flex gap-2">
                  <input 
                    type="text"
                    disabled={!activeConvId}
                    placeholder={activeConvId ? "Ask Patel to explain authentication, check endpoints, or write code..." : "Select or create a conversation to start"}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 glass-input py-2.5 px-4"
                  />
                  <button 
                    type="submit"
                    disabled={!activeConvId || chatLoading}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB: CODE GENERATOR */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              <div className="glass-panel p-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Wand2 className="text-indigo-400" />
                  AI CRUD Generator
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                  Input a database model (e.g. <code>Product</code>) and fields. The generator will create migrations, models, API controllers, and append resource routes to <code>routes/api.php</code> directly inside your project structure.
                </p>

                <form onSubmit={handleGenerateCrud} className="space-y-6">
                  <div className="flex flex-col gap-1.5 max-w-sm">
                    <label className="text-xs text-slate-400 font-semibold">Model Name (Singular)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Order"
                      value={genModelName}
                      onChange={(e) => setGenModelName(e.target.value)}
                      className="glass-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-semibold block">Model Fields</label>
                    
                    {genFields.map((field, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input 
                          type="text"
                          placeholder="Field Name (e.g. quantity)"
                          value={field.name}
                          onChange={(e) => handleGenFieldChange(index, 'name', e.target.value)}
                          className="glass-input text-sm flex-1 max-w-[200px]"
                        />

                        <select
                          value={field.type}
                          onChange={(e) => handleGenFieldChange(index, 'type', e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="string">String (varchar)</option>
                          <option value="integer">Integer (int)</option>
                          <option value="text">Text (longtext)</option>
                          <option value="boolean">Boolean (tinyint)</option>
                          <option value="double">Double / Decimal</option>
                          <option value="date">Date</option>
                        </select>

                        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={field.nullable}
                            onChange={(e) => handleGenFieldChange(index, 'nullable', e.target.checked)}
                            className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500"
                          />
                          Nullable
                        </label>

                        {genFields.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeGenField(index)}
                            className="p-2 text-slate-500 hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addGenField}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1.5 px-2.5 rounded hover:bg-indigo-500/5 transition-colors mt-2"
                    >
                      <Plus size={14} />
                      Add Field
                    </button>
                  </div>

                  {genError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm max-w-xl">
                      <AlertCircle size={16} />
                      <span>{genError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={genLoading || !selectedProjectId}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {genLoading ? 'Generating CRUD files...' : 'Generate CRUD'}
                  </button>
                </form>
              </div>

              {/* Generation Result Output */}
              {genResult && (
                <div className="glass-panel p-6 space-y-4">
                  <div className="flex items-center gap-2 text-green-400 font-semibold">
                    <CheckCircle2 size={18} />
                    <span>CRUD components successfully generated!</span>
                  </div>
                  
                  <div className="space-y-3 font-mono text-xs text-slate-400">
                    <div>
                      <span className="text-white font-semibold">1. Migration created:</span>
                      <div className="bg-black/20 p-2 rounded border border-white/5 mt-1 overflow-x-auto">
                        {genResult.files.migration.path}
                      </div>
                    </div>
                    <div>
                      <span className="text-white font-semibold">2. Model created:</span>
                      <div className="bg-black/20 p-2 rounded border border-white/5 mt-1 overflow-x-auto">
                        {genResult.files.model.path}
                      </div>
                    </div>
                    <div>
                      <span className="text-white font-semibold">3. Controller created:</span>
                      <div className="bg-black/20 p-2 rounded border border-white/5 mt-1 overflow-x-auto">
                        {genResult.files.controller.path}
                      </div>
                    </div>
                    {genResult.route_added && (
                      <div className="text-indigo-400">
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
