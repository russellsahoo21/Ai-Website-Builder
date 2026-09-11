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
import { 
  DEFAULT_MODEL, 
  AVAILABLE_MODELS, 
  streamGenerateWebsite 
} from './services/aiService';
import { STARTER_TEMPLATES } from './templates/starterTemplates';
import { downloadProjectZip } from './utils/zipExporter';
import { buildPreviewDoc } from './utils/previewBuilder';

function getRouteFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  if (['templates', 'showcase', 'integrations', 'changelog', 'pricing', 'docs', 'studio'].includes(hash)) {
    return hash;
  }
  return 'landing';
}

export default function App() {
  const { isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();

  // Navigation & Page Route State (Defaults to 'landing')
  const [currentRoute, setCurrentRoute] = useState(getRouteFromHash);

  // Studio IDE States
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code'
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Configuration States
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('aethercraft_openrouter_key') || 
           import.meta.env.VITE_OPENROUTER_API_KEY || 
           '';
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('aethercraft_model');
    if (saved && AVAILABLE_MODELS.some(m => m.id === saved)) {
      return saved;
    }
    return import.meta.env.VITE_DEFAULT_MODEL || DEFAULT_MODEL;
  });

  // Project Code & Conversation States
  const [files, setFiles] = useState({});
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef(null);

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Sync route with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const target = getRouteFromHash();
      if (target === 'studio' && isLoaded && !isSignedIn) {
        clerk.openSignIn();
        setCurrentRoute('landing');
        window.location.hash = '';
      } else {
        setCurrentRoute(target);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isSignedIn, isLoaded, clerk]);

  const navigateTo = (route) => {
    if (route === 'studio' && !isSignedIn) {
      clerk.openSignIn();
      return;
    }
    setCurrentRoute(route);
    window.location.hash = route === 'landing' ? '' : `/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Behind-The-Scenes (BTS) Auto-Healing References
  const autoFixCountRef = useRef(0);
  const isGeneratingRef = useRef(isGenerating);
  const filesRef = useRef(files);
  const messagesRef = useRef(messages);
  const apiKeyRef = useRef(apiKey);
  const selectedModelRef = useRef(selectedModel);

  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);

  // Execute Behind-The-Scenes automated repair
  const executeAutoFix = useCallback(async (errorMsg, isManual = false) => {
    if (!apiKeyRef.current || isGeneratingRef.current) return;
    if (!isManual && autoFixCountRef.current >= 2) return;

    if (!isManual) {
      autoFixCountRef.current += 1;
    }

    const count = autoFixCountRef.current;
    const isHtmlError = errorMsg.includes('<!DOCTYPE') || errorMsg.includes('<html');
    let fixPrompt = `A runtime error occurred in the sandbox preview:\n"${errorMsg}"\n\n`;
    if (isHtmlError) {
      fixPrompt += `The application code was output as raw HTML instead of a React component. Please convert this into a pure React 18 component in App.jsx (using Tailwind CSS and Lucide icons), wrapped in <<<FILE:App.jsx>>> and <<<END_FILE>>>.`;
    } else {
      fixPrompt += `Please fix this error in App.jsx. Ensure all context hooks (e.g. useApp, useContext) have safe default values or are called inside their provider, component names do not collide with reserved words, and return the complete corrected App.jsx wrapped in <<<FILE:App.jsx>>> and <<<END_FILE>>>.`;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const newMessages = [
      ...messagesRef.current,
      {
        role: 'system',
        content: `⚡ Auto-Repairing runtime error in background (${count}/2): "${errorMsg.slice(0, 80)}..."`
      }
    ];
    setMessages(newMessages);
    setIsGenerating(true);

    try {
      await streamGenerateWebsite({
        apiKey: apiKeyRef.current,
        model: selectedModelRef.current,
        messages: [
          ...messagesRef.current,
          { role: 'user', content: fixPrompt }
        ],
        currentFiles: filesRef.current,
        signal: abortControllerRef.current.signal,
        onFileParsed: (parsedFiles) => {
          setFiles(prev => {
            const next = { ...prev, ...parsedFiles };
            if (parsedFiles['index.html'] && (parsedFiles['index.html'].trim().toLowerCase().startsWith('<!doctype') || parsedFiles['index.html'].trim().toLowerCase().startsWith('<html'))) {
              delete next['App.jsx'];
              delete next['App.js'];
            }
            if (parsedFiles['App.jsx'] && !parsedFiles['App.jsx'].trim().toLowerCase().startsWith('<!doctype')) {
              if (next['index.html'] && (next['index.html'].includes('<!DOCTYPE') || next['index.html'].includes('<html'))) {
                delete next['index.html'];
              }
            }
            return next;
          });
        },
        onComplete: (fullText, finalFiles) => {
          if (Object.keys(finalFiles).length > 0) {
            setFiles(finalFiles);
          }
          setMessages(prev => [
            ...prev,
            { role: 'ai', content: "⚡ Auto-repair complete. Fix applied to the preview sandbox." }
          ]);
          setIsGenerating(false);
          setRefreshTrigger(prev => prev + 1);
        },
        onError: (err) => {
          console.error("Auto-fix error:", err);
          setIsGenerating(false);
        }
      });
    } catch (err) {
      console.error("Auto-fix failed:", err);
      setIsGenerating(false);
    }
  }, []);

  // Listen for sandbox runtime errors and manual fix triggers
  useEffect(() => {
    const handleSandboxMessage = (event) => {
      if (event.data?.type === 'TRIGGER_AUTO_FIX') {
        const errorMsg = event.data.error?.message || 'Rendering error in component';
        executeAutoFix(errorMsg, true);
      } else if (event.data?.type === 'SANDBOX_RUNTIME_ERROR') {
        const errorMsg = event.data.error?.message || 'Runtime error in component';
        executeAutoFix(errorMsg, false);
      }
    };
    window.addEventListener('message', handleSandboxMessage);
    return () => window.removeEventListener('message', handleSandboxMessage);
  }, [executeAutoFix]);

  // Handle Code Generation via AI
  const handleSendMessage = async (userPrompt) => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    autoFixCountRef.current = 0; // Reset auto-fix count on manual user message

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const newMessages = [
      ...messages,
      { role: 'user', content: userPrompt }
    ];
    setMessages(newMessages);
    setIsGenerating(true);

    try {
      await streamGenerateWebsite({
        apiKey,
        model: selectedModel,
        messages: newMessages,
        currentFiles: files,
        signal: abortControllerRef.current.signal,
        onFileParsed: (parsedFiles) => {
          setFiles(prev => {
            const next = { ...prev, ...parsedFiles };
            if (parsedFiles['index.html'] && (parsedFiles['index.html'].trim().toLowerCase().startsWith('<!doctype') || parsedFiles['index.html'].trim().toLowerCase().startsWith('<html'))) {
              delete next['App.jsx'];
              delete next['App.js'];
            }
            if (parsedFiles['App.jsx'] && !parsedFiles['App.jsx'].trim().toLowerCase().startsWith('<!doctype')) {
              if (next['index.html'] && (next['index.html'].includes('<!DOCTYPE') || next['index.html'].includes('<html'))) {
                delete next['index.html'];
              }
            }
            return next;
          });
        },
        onComplete: (fullText, finalFiles) => {
          const filesCount = Object.keys(finalFiles).length;
          if (filesCount > 0) {
            setFiles(finalFiles);
          }

          // Extract clean friendly summary without dumping raw code
          let replyText = "";
          if (fullText.includes('<<<FILE:')) {
            replyText = fullText.split('<<<FILE:')[0].trim();
          } else if (fullText.includes('```')) {
            replyText = fullText.split('```')[0].trim();
          } else {
            replyText = fullText.trim();
          }

          // Filter out markdown headers or filenames that leaked into replyText (e.g. "## 1:index.html")
          if (/^(?:#{1,4}|\*\*|File:?)\s*(?:[0-9]+[:.]\s*)?[\w./-]+\*?:?$/i.test(replyText.trim())) {
            replyText = "";
          }

          if (!replyText || replyText.length < 5) {
            replyText = filesCount > 0 
              ? "Application synthesized successfully. Changes are live in the preview sandbox."
              : "Synthesis complete. Inspect code or submit further instructions.";
          }

          if (filesCount === 0) {
            replyText += "\n\n(Notice: Model provided an overview without code blocks. Try prompting: 'Generate the complete App.jsx React component for this').";
          }

          setMessages(prev => [
            ...prev,
            { role: 'ai', content: replyText }
          ]);
          setIsGenerating(false);
          setRefreshTrigger(prev => prev + 1);
        },
        onError: (err) => {
          console.error(err);
          setMessages(prev => [
            ...prev,
            { role: 'ai', content: `Compilation error: ${err.message || 'Failed to connect to backend engine'}` }
          ]);
          setIsGenerating(false);
        }
      });
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  // Launch Studio with a pre-loaded prompt from the Landing Page
  const handleLaunchWithPrompt = (promptText) => {
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }
    setFiles({});
    setMessages([]);
    navigateTo('studio');
    setTimeout(() => {
      handleSendMessage(promptText);
    }, 150);
  };

  // Handle Loading a Starter Template
  const handleLoadTemplate = (template) => {
    setFiles(template.files);
    setMessages([
      { role: 'ai', content: `Template loaded: "${template.name}". Inspect code or submit instructions to refine.` }
    ]);
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }
    navigateTo('studio');
    setRefreshTrigger(prev => prev + 1);
  };

  // Clear workspace
  const handleClearWorkspace = () => {
    setFiles({
      "index.html": "<!DOCTYPE html><html><body class='bg-[#090a0d] text-white flex items-center justify-center h-screen font-sans'><div class='text-center'><h1 class='text-xl font-bold mb-2'>Canvas Ready</h1><p class='text-zinc-500 text-xs'>Enter instructions on the left to synthesize software.</p></div></body></html>",
      "styles.css": "",
      "script.js": ""
    });
    setMessages([]);
    setRefreshTrigger(prev => prev + 1);
  };

  // Manual File Update from Code Inspector
  const handleFileUpdate = (filename, newContent) => {
    setFiles(prev => ({
      ...prev,
      [filename]: newContent
    }));
    setRefreshTrigger(prev => prev + 1);
  };

  // Open in standalone full browser tab
  const handleOpenNewTab = () => {
    const doc = buildPreviewDoc(files);
    if (!doc) return;
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Download project as ZIP
  const handleDownloadZip = () => {
    downloadProjectZip(files, 'aethercraft-app');
  };

  // ---------------- Render Studio View (Protected by Clerk) ----------------
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
          onBackToHome={() => navigateTo('landing')}
          isGenerating={isGenerating}
        />

        <div className="flex-1 flex overflow-hidden">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
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
              />
            ) : (
              <CodeInspector
                files={files}
                onFileUpdate={handleFileUpdate}
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

  // ---------------- Render Platform Pages ----------------
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0d] text-zinc-100 font-sans">
      <Navigation
        currentRoute={currentRoute}
        navigateTo={navigateTo}
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
          <TemplatesPage
            onLoadTemplate={handleLoadTemplate}
            navigateTo={navigateTo}
          />
        )}
        {currentRoute === 'showcase' && (
          <ShowcasePage
            onLoadTemplate={handleLoadTemplate}
            navigateTo={navigateTo}
          />
        )}
        {currentRoute === 'integrations' && (
          <IntegrationsPage
            navigateTo={navigateTo}
          />
        )}
        {currentRoute === 'changelog' && (
          <ChangelogPage />
        )}
        {currentRoute === 'pricing' && (
          <PricingPage
            navigateTo={navigateTo}
          />
        )}
        {currentRoute === 'docs' && (
          <DocsPage
            navigateTo={navigateTo}
          />
        )}
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
