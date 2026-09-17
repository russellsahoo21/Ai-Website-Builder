"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LandingPage from './views/LandingPage';
import DashboardPage from './views/DashboardPage';
import TemplatesPage from './views/TemplatesPage';
import ShowcasePage from './views/ShowcasePage';
import IntegrationsPage from './views/IntegrationsPage';
import ChangelogPage from './views/ChangelogPage';
import PricingPage from './views/PricingPage';
import DocsPage from './views/DocsPage';
import CheckoutPage from './views/CheckoutPage';
import AuthPage from './views/AuthPage';
import FeedbackView from './views/FeedbackView';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import PreviewPanel from './components/PreviewPanel';
import CodeInspector from './components/CodeInspector';
import SettingsModal from './components/SettingsModal';
import VersionHistoryModal from './components/VersionHistoryModal';
import ExportValidationModal from './components/ExportValidationModal';
import { useUser, useClerk } from '@clerk/react';
import { DEFAULT_MODEL, AVAILABLE_MODELS } from './services/aiService';
import { useGeneration } from './hooks/useGeneration';
import { useFileHistory } from './hooks/useFileHistory';
import { useSandboxMessages } from './hooks/useSandboxMessages';
import { STARTER_TEMPLATES } from './templates/starterTemplates';
import { downloadProjectZip } from './utils/zipExporter';
import { validateProjectBuild } from './utils/exportValidator';
import { buildPreviewDoc } from './utils/previewBuilder';
import { ensureStandardReactStructure } from './utils/projectStructure';
import { 
  getAllProjects, 
  getProjectById, 
  saveProject, 
  createNewProject, 
  deleteProject, 
  duplicateProject, 
  getActiveProjectId, 
  setActiveProjectId, 
  deriveProjectName,
  setCurrentUserId,
  syncProjectsWithCloud,
  createProjectVersion,
  getProjectVersions,
  restoreProjectVersion,
  deleteProjectVersion
} from './services/projectService';
import { setCurrentUserId as setTokenCurrentUserId } from './services/tokenService';
import { syncUserProfile, fetchUserProfile } from './services/dbService';
import { getSession } from './services/authService';

function getAppRoute() {
  const path = window.location.pathname.replace(/^\//, '').split('?')[0].split('/')[0];
  const valid = ['templates', 'showcase', 'integrations', 'changelog', 'pricing', 'docs', 'feedback', 'studio', 'dashboard', 'checkout', 'login', 'signup'];
  if (valid.includes(path)) return path;

  const hash = window.location.hash.replace('#/', '').replace('#', '').split('?')[0];
  if (valid.includes(hash)) return hash;
  return 'landing';
}

export default function App({ initialRoute }) {
  const { isSignedIn: clerkSignedIn, isLoaded, user: clerkUser } = useUser();
  const guestSession = typeof localStorage !== 'undefined' ? getSession() : null;
  const isSignedIn = clerkSignedIn || Boolean(guestSession);
  const user = clerkUser || guestSession;
  const clerk = useClerk();

  // — Routing & Checkout state —
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (initialRoute) return initialRoute;
    return getAppRoute();
  });
  const [checkoutPlan, setCheckoutPlan] = useState('pro');
  const [checkoutCycle, setCheckoutCycle] = useState('annual');
  const [returnRoute, setReturnRoute] = useState('landing');

  // — Studio UI state —
  const [activeTab, setActiveTab] = useState('preview');
  const [viewport, setViewport] = useState('desktop');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // — Configuration —
  const [apiKey, setApiKey] = useState(() =>
    (typeof window !== 'undefined' ? localStorage.getItem('aethercraft_openrouter_key') : null) ||
    import.meta.env.VITE_OPENROUTER_API_KEY || ''
  );
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aethercraft_model');
      if (saved && AVAILABLE_MODELS.some(m => m.id === saved)) return saved;
    }
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
  const [userProfile, setUserProfile] = useState(null);

  // — Phase 2: History & Modal states —
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isExportValidationOpen, setIsExportValidationOpen] = useState(false);
  const [exportValidationResult, setExportValidationResult] = useState(null);

  // Stable refs for hooks
  const filesRef = useRef(files);
  const messagesRef = useRef(messages);
  const apiKeyRef = useRef(apiKey);
  const selectedModelRef = useRef(selectedModel);
  const activeProjectIdRef = useRef(activeProjectId);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);
  useEffect(() => { activeProjectIdRef.current = activeProjectId; }, [activeProjectId]);

  // File undo/redo history stack
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    pushSnapshot,
    clearHistory
  } = useFileHistory(files, (restoredFiles) => {
    setFiles(restoredFiles);
    setRefreshTrigger(prev => prev + 1);
  });

  const onRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    if (filesRef.current && Object.keys(filesRef.current).length > 0) {
      pushSnapshot(filesRef.current, 'AI Synthesis Checkpoint');
      if (activeProjectIdRef.current) {
        const lastPrompt = messagesRef.current?.slice().reverse().find(m => m.role === 'user')?.content || '';
        createProjectVersion(
          activeProjectIdRef.current,
          lastPrompt ? `Generated: ${lastPrompt.slice(0, 32)}...` : 'AI Synthesis Checkpoint',
          filesRef.current,
          lastPrompt
        );
        setProjects(getAllProjects());
      }
    }
  }, [pushSnapshot]);

  // Sync user profile & projects when auth state settles
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user?.id) {
      setCurrentUserId(user.id);
      setTokenCurrentUserId(user.id);
      setProjects(getAllProjects(user.id));
      syncUserProfile(user).then(prof => {
        if (prof) setUserProfile(prof);
      });
      syncProjectsWithCloud(user.id).then(syncedProjects => {
        if (syncedProjects && syncedProjects.length > 0) {
          setProjects(syncedProjects);
          const activeId = getActiveProjectId(user.id);
          const active = syncedProjects.find(p => p.id === activeId) || syncedProjects[0];
          if (active) {
            setActiveProjectIdState(active.id);
            setFiles(active.files || {});
            setMessages(active.messages || []);
            clearHistory(active.files || {});
          }
        }
      });
    } else {
      setCurrentUserId(null);
      setTokenCurrentUserId(null);
      setUserProfile(null);
    }
  }, [isLoaded, isSignedIn, user?.id, clearHistory]);

  // Auto-save active project changes to localStorage & Cloud (debounced)
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

  // — Generation hook —
  const { handleSendMessage, handleCancelGeneration, executeAutoFix, autoFixCountRef, telemetry } = useGeneration({
    apiKey,
    selectedModel,
    userId: user?.id,
    filesRef,
    messagesRef,
    apiKeyRef,
    selectedModelRef,
    setFiles,
    setMessages,
    setIsGenerating,
    onRefresh,
  });

  // — Sandbox postMessage listener (Studio only, never runs on dashboard or behind user's back) —
  useSandboxMessages({
    isGenerating,
    enabled: currentRoute === 'studio',
    onRuntimeError: useCallback((msg) => {
      console.warn('[Sandbox Runtime Error Detected]', msg);
      executeAutoFix(msg, false);
    }, [executeAutoFix]),
    onManualFix: useCallback((msg) => executeAutoFix(msg, true), [executeAutoFix]),
  });

  // — Route sync —
  useEffect(() => {
    // If user lands on #/login or #/signup, cleanly normalize to /login or /signup
    const initialHash = window.location.hash.replace('#/', '').replace('#', '').split('?')[0];
    if (initialHash === 'login' || initialHash === 'signup') {
      window.history.replaceState({}, '', `/${initialHash}`);
      window.location.hash = '';
      setCurrentRoute(initialHash);
    }

    const onLocationChange = () => {
      const target = getAppRoute();
      if ((target === 'studio' || target === 'dashboard') && isLoaded && !isSignedIn) {
        navigateTo('login');
      } else {
        setCurrentRoute(target);
      }
    };

    window.addEventListener('hashchange', onLocationChange);
    window.addEventListener('popstate', onLocationChange);
    return () => {
      window.removeEventListener('hashchange', onLocationChange);
      window.removeEventListener('popstate', onLocationChange);
    };
  }, [isSignedIn, isLoaded]);

  // If user signs in while on login or signup view, redirect directly to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn && (currentRoute === 'login' || currentRoute === 'signup')) {
      navigateTo('dashboard');
    }
  }, [isSignedIn, isLoaded, currentRoute]);

  // If user visits studio while not signed in, redirect directly to login
  useEffect(() => {
    if (isLoaded && !isSignedIn && currentRoute === 'studio') {
      navigateTo('login');
    }
  }, [isSignedIn, isLoaded, currentRoute]);

  const navigateTo = (route, params = {}) => {
    if ((route === 'studio' || route === 'dashboard') && !isSignedIn) { 
      navigateTo('login'); 
      return; 
    }
    if (route === 'checkout') {
      setReturnRoute(currentRoute || 'landing');
    }
    if (params.plan) setCheckoutPlan(params.plan);
    if (params.cycle) setCheckoutCycle(params.cycle);
    setCurrentRoute(route);

    if (typeof window !== 'undefined') {
      const targetPath = route === 'landing' ? '/' : `/${route}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
      if (window.location.hash) {
        window.location.hash = '';
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // — Project Library Actions —
  const handleSelectProject = (project) => {
    setActiveProjectIdState(project.id);
    setActiveProjectId(project.id);
    setFiles(project.files || {});
    setMessages(project.messages || []);
    clearHistory(project.files || {});
    setRefreshTrigger(prev => prev + 1);
  };

  const MAX_FREE_PROJECTS = 5;
  const MAX_PRO_PROJECTS = 50;

  const checkProjectQuota = () => {
    const userPlan = userProfile?.plan || 'free';
    if (userPlan === 'enterprise' || userPlan === 'studio' || userPlan === 'unlimited') {
      return true;
    }
    if (userPlan === 'pro') {
      if (projects.length >= MAX_PRO_PROJECTS) {
        alert(`Pro plan limit reached (${projects.length}/${MAX_PRO_PROJECTS} projects). Upgrade to Studio Unlimited for unlimited projects or delete an existing project.`);
        navigateTo('checkout', { plan: 'enterprise' });
        return false;
      }
      return true;
    }
    if (projects.length >= MAX_FREE_PROJECTS) {
      alert(`Free tier limit reached (${projects.length}/${MAX_FREE_PROJECTS} projects). Upgrade to Pro for up to 50 projects or delete an existing project.`);
      navigateTo('checkout', { plan: 'pro' });
      return false;
    }
    return true;
  };

  const handleCreateNewProject = (initialName = 'New Project', initialPrompt = '') => {
    if (!checkProjectQuota()) return null;
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
    if (!checkProjectQuota()) return;
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
  const onSendMessage = useCallback(async (prompt, enginePrompt = null) => {
    const isProviderWithDefault = selectedModel.includes('gemini') || selectedModel.includes('nvidia') || selectedModel.includes('qwen') || selectedModel.includes('groq') || selectedModel.includes('gpt-oss');
    const hasKey = Boolean(apiKey || isProviderWithDefault || import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_GROQ_API_KEY);
    if (!hasKey) { setIsSettingsOpen(true); return; }

    // If current project has a generic name and empty prompt, update its title with the user prompt
    const currentProj = projects.find(p => p.id === activeProjectId);
    if (currentProj && (currentProj.name === 'New Project' || currentProj.name === 'Untitled Project')) {
      const derived = deriveProjectName(prompt);
      saveProject({ ...currentProj, name: derived, prompt });
      setProjects(getAllProjects());
    }

    await handleSendMessage(prompt, enginePrompt);
  }, [apiKey, handleSendMessage, projects, activeProjectId]);

  const handleLoadTemplate = (template) => {
    if (!checkProjectQuota()) return;
    handleCancelGeneration();
    if (autoFixCountRef) autoFixCountRef.current = 0;
    const newProj = createNewProject({
      name: template.name,
      prompt: template.tagline || template.description,
      files: template.files || {},
      messages: [{ role: 'ai', content: `Template loaded: "${template.name}". Inspect code or submit instructions to refine.` }]
    });
    setProjects(getAllProjects());
    setActiveProjectIdState(newProj.id);
    setActiveProjectId(newProj.id);
    const initialFiles = newProj.files || template.files || {};
    setFiles(initialFiles);
    setMessages([{ role: 'ai', content: `Template loaded: "${template.name}". Inspect code or submit instructions to refine.` }]);
    clearHistory(initialFiles);
    if (!isSignedIn) { navigateTo('login'); return; }
    navigateTo('studio');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClearWorkspace = () => {
    setFiles({});
    setMessages([]);
    clearHistory({});
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileUpdate = (filename, newContent) => {
    setFiles(prev => {
      const next = { ...prev, [filename]: newContent };
      pushSnapshot(next, `Edited ${filename}`);
      return next;
    });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileCreate = (filename, initialContent = '') => {
    setFiles(prev => {
      const next = { ...prev, [filename]: initialContent };
      pushSnapshot(next, `Created ${filename}`);
      return next;
    });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileDelete = (filename) => {
    setFiles(prev => {
      const next = { ...prev };
      delete next[filename];
      pushSnapshot(next, `Deleted ${filename}`);
      return next;
    });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRestoreVersion = (version) => {
    if (!version || !version.files || !activeProjectId) return;
    const res = restoreProjectVersion(activeProjectId, version.id);
    if (res?.project) {
      setFiles(res.project.files);
      pushSnapshot(res.project.files, `Restored: ${version.label}`);
      setProjects(getAllProjects());
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDeleteVersion = (versionId) => {
    if (!activeProjectId || !versionId) return;
    deleteProjectVersion(activeProjectId, versionId);
    setProjects(getAllProjects());
  };

  const handleDownloadZip = () => {
    const validation = validateProjectBuild(files);
    if (!validation.isValid || validation.errors.length > 0 || (validation.warnings && validation.warnings.length > 0)) {
      setExportValidationResult(validation);
      setIsExportValidationOpen(true);
      return;
    }
    downloadProjectZip(files, activeProject?.name || 'aethercraft-app');
  };

  const handleOpenNewTab = () => {
    const hasAnyFiles = files && Object.keys(files).length > 0;
    if (!hasAnyFiles) {
      alert("Please synthesize or generate a project first before opening preview in a new tab.");
      return;
    }

    const working = ensureStandardReactStructure(files, activeProject?.name || 'AetherCraft App');
    const doc = buildPreviewDoc(working);
    if (!doc) {
      alert("Application code is still compiling. Please wait a moment.");
      return;
    }

    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(doc);
      win.document.close();
    } else {
      const blob = new Blob([doc], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    }
  };

  const handleLaunchWithPrompt = (promptText, enginePrompt = null) => {
    if (!isSignedIn) { navigateTo('login'); return; }
    if (!checkProjectQuota()) return;
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
    setTimeout(() => onSendMessage(promptText, enginePrompt), 150);
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
          onDownloadZip={handleDownloadZip}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProjects={() => navigateTo('dashboard')}
          projectCount={projects.length}
          activeProjectName={activeProject?.name || ''}
          onBackToHome={() => navigateTo('landing')}
          isGenerating={isGenerating}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
          versionCount={getProjectVersions(activeProjectId).length}
        />

        <div className="flex-1 flex overflow-hidden">
          <ChatPanel
            messages={messages}
            onSendMessage={onSendMessage}
            onLoadTemplate={handleLoadTemplate}
            onClearWorkspace={handleClearWorkspace}
            isGenerating={isGenerating}
            onCancelGeneration={handleCancelGeneration}
            selectedModel={selectedModel}
            telemetry={telemetry}
            onSelectModel={(modelId) => {
              setSelectedModel(modelId);
              if (typeof window !== 'undefined') {
                localStorage.setItem('aethercraft_model', modelId);
              }
            }}
            availableModels={AVAILABLE_MODELS}
          />

          <div className="flex-1 h-full overflow-hidden relative">
            {activeTab === 'preview' ? (
              <PreviewPanel
                files={files}
                viewport={viewport}
                keyTrigger={refreshTrigger}
                isGenerating={isGenerating}
                telemetry={telemetry}
                onCancel={handleCancelGeneration}
                promptText={messages.slice().reverse().find(m => m.role === 'user')?.content || ''}
                onAutoFix={(err) => executeAutoFix(err, true)}
                onViewCode={() => setActiveTab('code')}
              />
            ) : (
              <CodeInspector
                files={files}
                onFileUpdate={handleFileUpdate}
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
              />
            )}
          </div>
        </div>

        <VersionHistoryModal
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          versions={getProjectVersions(activeProjectId)}
          activeProjectName={activeProject?.name || ''}
          onRestoreVersion={handleRestoreVersion}
          onDeleteVersion={handleDeleteVersion}
        />

        <ExportValidationModal
          isOpen={isExportValidationOpen}
          onClose={() => setIsExportValidationOpen(false)}
          validationResult={exportValidationResult}
          onConfirmExport={() => downloadProjectZip(files, activeProject?.name || 'aethercraft-app')}
          onAutoFix={(err) => executeAutoFix(err, true)}
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

  // ── Dedicated Dashboard View (Full-height with permanent Left Sidebar) ────
  if (currentRoute === 'dashboard') {
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
            const p = handleCreateNewProject(name, prompt);
            if (p) navigateTo('studio');
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
          userProfile={userProfile}
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

      <main className="flex-1 flex flex-col">
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
        {currentRoute === 'feedback' && (
          <div className="py-8">
            <FeedbackView
              userEmail={user?.primaryEmailAddress?.emailAddress || ''}
              userName={user?.fullName || user?.firstName || ''}
            />
          </div>
        )}
        {currentRoute === 'checkout' && (
          <CheckoutPage 
            initialPlanId={checkoutPlan}
            initialBillingCycle={checkoutCycle}
            returnRoute={returnRoute}
            navigateTo={navigateTo}
            user={user}
            onPlanUpdated={(newPlan) => setUserProfile(prev => ({ ...(prev || {}), plan: newPlan }))}
          />
        )}
        {(currentRoute === 'login' || currentRoute === 'signup' || (currentRoute === 'studio' && !isSignedIn)) && (
          <AuthPage mode={currentRoute === 'signup' ? 'signup' : 'login'} navigateTo={navigateTo} />
        )}
      </main>

      {currentRoute !== 'login' && currentRoute !== 'signup' && (
        <Footer navigateTo={navigateTo} />
      )}

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
