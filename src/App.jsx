import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
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

function getRouteFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const valid = ['templates', 'showcase', 'integrations', 'changelog', 'pricing', 'docs', 'studio'];
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

  // — Workspace state —
  const [files, setFiles] = useState({});
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Stable refs for hooks (avoids stale closure bugs)
  const filesRef = useRef(files);
  const messagesRef = useRef(messages);
  const apiKeyRef = useRef(apiKey);
  const selectedModelRef = useRef(selectedModel);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);

  const onRefresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  // — Generation hook (all AI streaming + BTS auto-fix logic) —
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
      if (target === 'studio' && isLoaded && !isSignedIn) {
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
    if (route === 'studio' && !isSignedIn) { clerk.openSignIn(); return; }
    setCurrentRoute(route);
    window.location.hash = route === 'landing' ? '' : `/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // — Studio actions —
  const onSendMessage = useCallback(async (prompt) => {
    if (!apiKey) { setIsSettingsOpen(true); return; }
    await handleSendMessage(prompt);
  }, [apiKey, handleSendMessage]);

  const handleLoadTemplate = (template) => {
    setFiles(template.files);
    setMessages([{ role: 'ai', content: `Template loaded: "${template.name}". Inspect code or submit instructions to refine.` }]);
    if (!isSignedIn) { clerk.openSignIn(); return; }
    navigateTo('studio');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClearWorkspace = () => {
    setFiles({});
    setMessages([]);
    setRefreshTrigger(prev => prev + 1);
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
    setFiles({});
    setMessages([]);
    navigateTo('studio');
    setTimeout(() => onSendMessage(promptText), 150);
  };

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
          onDownloadZip={() => downloadProjectZip(files, 'aethercraft-app')}
          onOpenSettings={() => setIsSettingsOpen(true)}
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

  // ── Public Pages ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0d] text-zinc-100 font-sans">
      <Navigation currentRoute={currentRoute} navigateTo={navigateTo} />

      <main className="flex-1">
        {currentRoute === 'landing' && (
          <LandingPage navigateTo={navigateTo} onLaunchWithPrompt={handleLaunchWithPrompt} onLoadTemplate={handleLoadTemplate} />
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
