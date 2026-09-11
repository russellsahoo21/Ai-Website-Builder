import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import TemplatesPage from './pages/TemplatesPage';
import ShowcasePage from './pages/ShowcasePage';
import IntegrationsPage from './pages/IntegrationsPage';
import ChangelogPage from './pages/ChangelogPage';
import PricingPage from './pages/PricingPage';
import DocsPage from './pages/DocsPage';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import PreviewPanel from './components/PreviewPanel';
import CodeInspector from './components/CodeInspector';
import SettingsModal from './components/SettingsModal';
import { useUser, useClerk } from '@clerk/react';
import { DEFAULT_MODEL, AVAILABLE_MODELS } from './services/aiService';
import { useGeneration } from './hooks/useGeneration';
import { useSandboxMessages } from './hooks/useSandboxMessages';
import { STARTER_TEMPLATES } from './templates/starterTemplates';
import { downloadProjectZip } from './utils/zipExporter';
import { buildPreviewDoc } from './utils/previewBuilder';
import { 
  getAllProjects, 
  getProjectById, 
  saveProject, 
  createNewProject, 
  deleteProject, 
  duplicateProject, 
  getActiveProjectId, 
  setActiveProjectId, 
  deriveProjectName 
} from './services/projectService';

function getRouteFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const valid = ['templates', 'showcase', 'integrations', 'changelog', 'pricing', 'docs', 'studio', 'dashboard'];
  return valid.includes(hash) ? hash : 'landing';
}

export default function App() {
  const { isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();

  // — Routing —
  const [currentRoute, setCurrentRoute] = useState(getRouteFromHash);

  // — Studio UI state —
  const [activeTab, setActiveTab] = useState('preview');
  const [viewport, setViewport] = useState('desktop');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // — Configuration —
  const [apiKey, setApiKey] = useState(() =>
    localStorage.getItem('aethercraft_openrouter_key') ||
    import.meta.env.VITE_OPENROUTER_API_KEY || ''
  );
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('aethercraft_model');
    if (saved && AVAILABLE_MODELS.some(m => m.id === saved)) return saved;
    return import.meta.env.VITE_DEFAULT_MODEL || DEFAULT_MODEL;
  });

  // — Project Management & History State —
  const [projects, setProjects] = useState(() => getAllProjects());
  const [activeProjectId, setActiveProjectIdState] = useState(() => {
    const savedId = getActiveProjectId();
    const all = getAllProjects();
    if (savedId && all.some(p => p.id === savedId)) return savedId;
    return all.length > 0 ? all[0].id : null;
  });

  // — Workspace state initialized from Active Project —
  const [files, setFiles] = useState(() => {
    const all = getAllProjects();
    const savedId = getActiveProjectId();
    const active = all.find(p => p.id === savedId) || all[0];
    return active?.files || {};
  });

  const [messages, setMessages] = useState(() => {
    const all = getAllProjects();
    const savedId = getActiveProjectId();
    const active = all.find(p => p.id === savedId) || all[0];
    return active?.messages || [];
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-save active project changes to localStorage (debounced)
  useEffect(() => {
    if (!activeProjectId) return;
    const currentProj = projects.find(p => p.id === activeProjectId);
    if (!currentProj) return;

    const hasFiles = Object.keys(files).length > 0;
    if (!hasFiles && messages.length === 0) return;

    const timer = setTimeout(() => {
      const updated = saveProject({
        ...currentProj,
        files,
        messages
      });
      if (updated) {
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [files, messages, activeProjectId]);

  // Stable refs for hooks
  const filesRef = useRef(files);
  const messagesRef = useRef(messages);
  const apiKeyRef = useRef(apiKey);
  const selectedModelRef = useRef(selectedModel);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);

  const onRefresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  // — Generation hook —
  const { handleSendMessage, handleCancelGeneration, executeAutoFix } = useGeneration({
    apiKey,
    selectedModel,
    filesRef,
    messagesRef,
    apiKeyRef,
    selectedModelRef,
    setFiles,
    setMessages,
    setIsGenerating,
    onRefresh,
  });

  // — Sandbox postMessage listener —
  useSandboxMessages({
    onRuntimeError: useCallback((msg) => executeAutoFix(msg, false), [executeAutoFix]),
    onManualFix: useCallback((msg) => executeAutoFix(msg, true), [executeAutoFix]),
  });

  // — Route sync —
  useEffect(() => {
    const onHash = () => {
      const target = getRouteFromHash();
      if ((target === 'studio' || target === 'dashboard') && isLoaded && !isSignedIn) {
        clerk.openSignIn();
        setCurrentRoute('landing');
        window.location.hash = '';
      } else {
        setCurrentRoute(target);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [isSignedIn, isLoaded, clerk]);

  const navigateTo = (route) => {
    if ((route === 'studio' || route === 'dashboard') && !isSignedIn) { 
      clerk.openSignIn(); 
      return; 
    }
    setCurrentRoute(route);
    window.location.hash = route === 'landing' ? '' : `/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // — Project Library Actions —
  const handleSelectProject = (project) => {
    setActiveProjectIdState(project.id);
    setActiveProjectId(project.id);
    setFiles(project.files || {});
    setMessages(project.messages || []);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateNewProject = (initialName = 'New Project', initialPrompt = '') => {
    const newProj = createNewProject({
      name: initialName,
      prompt: initialPrompt,
      files: {},
      messages: []
    });
    setProjects(getAllProjects());
    setActiveProjectIdState(newProj.id);
    setActiveProjectId(newProj.id);
    setFiles({});
    setMessages([]);
    setRefreshTrigger(prev => prev + 1);
    return newProj;
  };

  const handleDeleteProject = (id) => {
    const remaining = deleteProject(id);
    setProjects(remaining);
    if (activeProjectId === id) {
      if (remaining.length > 0) {
        handleSelectProject(remaining[0]);
      } else {
        handleCreateNewProject();
      }
    }
  };

  const handleDuplicateProject = (id) => {
    const cloned = duplicateProject(id);
    if (cloned) {
      setProjects(getAllProjects());
      handleSelectProject(cloned);
    }
  };

  const handleRenameProject = (id, newName) => {
    const proj = projects.find(p => p.id === id);
    if (proj) {
      const updated = saveProject({ ...proj, name: newName });
      if (updated) {
        setProjects(prev => prev.map(p => p.id === id ? updated : p));
      }
    }
  };

  // — Studio message sender —
  const onSendMessage = useCallback(async (prompt) => {
    if (!apiKey) { setIsSettingsOpen(true); return; }

    // If current project has a generic name and empty prompt, update its title with the user prompt
    const currentProj = projects.find(p => p.id === activeProjectId);
    if (currentProj && (currentProj.name === 'New Project' || currentProj.name === 'Untitled Project')) {
      const derived = deriveProjectName(prompt);
      saveProject({ ...currentProj, name: derived, prompt });
      setProjects(getAllProjects());
    }

    await handleSendMessage(prompt);
  }, [apiKey, handleSendMessage, projects, activeProjectId]);

  const handleLoadTemplate = (template) => {
    const newProj = createNewProject({
      name: template.name,
      prompt: template.tagline || template.description,
      files: template.files || {},
      messages: [{ role: 'ai', content: `Template loaded: "${template.name}". Inspect code or submit instructions to refine.` }]
    });
    setProjects(getAllProjects());
    setActiveProjectIdState(newProj.id);
    setActiveProjectId(newProj.id);
    setFiles(template.files || {});
    setMessages([{ role: 'ai', content: `Template loaded: "${template.name}". Inspect code or submit instructions to refine.` }]);
    if (!isSignedIn) { clerk.openSignIn(); return; }
    navigateTo('studio');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClearWorkspace = () => {
    handleCreateNewProject('New Project', '');
  };

  const handleFileUpdate = (filename, newContent) => {
    setFiles(prev => ({ ...prev, [filename]: newContent }));
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileCreate = (filename, initialContent = '') => {
    setFiles(prev => ({ ...prev, [filename]: initialContent }));
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileDelete = (filename) => {
    setFiles(prev => {
      const next = { ...prev };
      delete next[filename];
      return next;
    });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleOpenNewTab = () => {
    const doc = buildPreviewDoc(files);
    if (!doc) return;
    const blob = new Blob([doc], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const handleLaunchWithPrompt = (promptText) => {
    if (!isSignedIn) { clerk.openSignIn(); return; }
    const newProj = createNewProject({
      name: deriveProjectName(promptText),
      prompt: promptText,
      files: {},
      messages: []
    });
    setProjects(getAllProjects());
    setActiveProjectIdState(newProj.id);
    setActiveProjectId(newProj.id);
    setFiles({});
    setMessages([]);
    navigateTo('studio');
    setTimeout(() => onSendMessage(promptText), 150);
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  // ── Studio View ──────────────────────────────────────────────────────────
  if (currentRoute === 'studio' && isSignedIn) {
    return (
      <div className="w-screen h-screen flex flex-col bg-[#090a0d] text-zinc-100 overflow-hidden font-sans">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          viewport={viewport}
          setViewport={setViewport}
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          onOpenNewTab={handleOpenNewTab}
          onDownloadZip={() => downloadProjectZip(files, activeProject?.name || 'aethercraft-app')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProjects={() => navigateTo('dashboard')}
          projectCount={projects.length}
          activeProjectName={activeProject?.name || ''}
          onBackToHome={() => navigateTo('landing')}
          isGenerating={isGenerating}
        />

        <div className="flex-1 flex overflow-hidden">
          <ChatPanel
            messages={messages}
            onSendMessage={onSendMessage}
            onLoadTemplate={handleLoadTemplate}
            onClearWorkspace={handleClearWorkspace}
            isGenerating={isGenerating}
            onCancelGeneration={handleCancelGeneration}
          />

          <div className="flex-1 h-full overflow-hidden relative">
            {activeTab === 'preview' ? (
              <PreviewPanel
                files={files}
                viewport={viewport}
                keyTrigger={refreshTrigger}
                isGenerating={isGenerating}
                onCancel={handleCancelGeneration}
                promptText={messages.slice().reverse().find(m => m.role === 'user')?.content || ''}
                onSandboxError={(msg) => executeAutoFix(msg, false)}
              />
            ) : (
              <CodeInspector
                files={files}
                onFileUpdate={handleFileUpdate}
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
              />
            )}
          </div>
        </div>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          setApiKey={setApiKey}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </div>
    );
  }

  // ── Dedicated Dashboard View (Full-height with permanent Left Sidebar) ────
  if (currentRoute === 'dashboard' && isSignedIn) {
    return (
      <div className="w-screen h-screen flex bg-[#07090e] text-zinc-100 overflow-hidden font-sans">
        <DashboardPage
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={(project) => {
            handleSelectProject(project);
            navigateTo('studio');
          }}
          onCreateNewProject={(name, prompt) => {
            handleCreateNewProject(name, prompt);
            navigateTo('studio');
          }}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onRenameProject={handleRenameProject}
          onLoadTemplate={(tmpl) => {
            handleLoadTemplate(tmpl);
            navigateTo('studio');
          }}
          onLaunchWithPrompt={handleLaunchWithPrompt}
          onOpenSettings={() => setIsSettingsOpen(true)}
          navigateTo={navigateTo}
          apiKey={apiKey}
          setApiKey={setApiKey}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          setApiKey={setApiKey}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </div>
    );
  }

  // ── Public Marketing Pages ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#080a0f] text-zinc-100 font-sans">
      <Navigation 
        currentRoute={currentRoute} 
        navigateTo={navigateTo} 
        projectCount={projects.length}
      />

      <main className="flex-1">
        {currentRoute === 'landing' && (
          <LandingPage 
            navigateTo={navigateTo} 
            onLaunchWithPrompt={handleLaunchWithPrompt} 
            onLoadTemplate={handleLoadTemplate} 
          />
        )}
        {currentRoute === 'templates' && (
          <TemplatesPage onLoadTemplate={handleLoadTemplate} navigateTo={navigateTo} />
        )}
        {currentRoute === 'showcase' && (
          <ShowcasePage onLoadTemplate={handleLoadTemplate} navigateTo={navigateTo} />
        )}
        {currentRoute === 'integrations' && <IntegrationsPage navigateTo={navigateTo} />}
        {currentRoute === 'changelog' && <ChangelogPage />}
        {currentRoute === 'pricing' && <PricingPage navigateTo={navigateTo} />}
        {currentRoute === 'docs' && <DocsPage navigateTo={navigateTo} />}
      </main>

      <Footer navigateTo={navigateTo} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </div>
  );
}
