import { useRef, useCallback, useState } from 'react';
import { streamGenerateWebsite } from '../services/aiService.js';
import { parseGeneratedFiles } from '../services/fileParser.js';
import { getFriendlyMessage, isRecoverable, buildFixPrompt } from '../sandbox/errorReporter.js';
import { ensureStandardReactStructure } from '../utils/projectStructure.js';
import { enhanceUserPrompt } from '../utils/promptEnhancer.js';

const MAX_AUTO_FIX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 8000;

/**
 * useGeneration
 * Manages AI code generation streaming and BTS auto-fix repair cycle.
 * Errors are NEVER shown as raw text — always mapped to friendly messages.
 *
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.selectedModel
 * @param {Object} params.filesRef  - ref to current files
 * @param {Object} params.messagesRef - ref to current messages
 * @param {Function} params.setFiles
 * @param {Function} params.setMessages
 * @param {Function} params.setIsGenerating
 * @param {Function} params.onRefresh - called after successful generation
 */
export function useGeneration({
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
}) {
  const abortControllerRef = useRef(null);
  const autoFixCountRef = useRef(0);
  const isGeneratingRef = useRef(false);

  const [telemetry, setTelemetry] = useState({
    status: 'idle',
    tokens: 0,
    bytes: 0,
    latestLine: '',
    activeFile: 'src/App.jsx',
    parsedFilesCount: 0,
  });

  const handleCancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    isGeneratingRef.current = false;
    setTelemetry({
      status: 'idle',
      tokens: 0,
      bytes: 0,
      latestLine: '',
      activeFile: 'src/App.jsx',
      parsedFilesCount: 0,
    });
    setIsGenerating(false);
  }, [setIsGenerating]);

  /**
   * Merge new parsed files into workspace, resolving React vs HTML conflicts.
   */
  const mergeFiles = useCallback((parsedResult, prevFiles) => {
    const { files: newFiles, needsReactConversion } = parsedResult;
    if (needsReactConversion) return { merged: prevFiles, needsConversion: true };
    if (!newFiles || Object.keys(newFiles).length === 0) return { merged: prevFiles, needsConversion: false };
    const merged = { ...prevFiles, ...newFiles };
    // Preserve src/App.jsx if previously present and not overwritten
    if (prevFiles['src/App.jsx'] && !newFiles['src/App.jsx']) {
      merged['src/App.jsx'] = prevFiles['src/App.jsx'];
    }
    return { merged, needsConversion: false };
  }, []);

  /**
   * BTS auto-fix. Silently repairs runtime errors without showing error text to user.
   * Shows a subtle status note in chat, then replaces it with success on completion.
   */
  const executeAutoFix = useCallback(async (rawErrorMsg, isManual = false) => {
    if (!apiKeyRef.current || isGeneratingRef.current) return;
    if (!isManual && autoFixCountRef.current >= MAX_AUTO_FIX_ATTEMPTS) {
      // Exhausted retries — show single friendly suggestion, no error text
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: 'The app needs a different approach. Try simplifying your prompt, or switch to a higher-quality model in Settings.',
        },
      ]);
      return;
    }

    if (!isManual) autoFixCountRef.current += 1;

    const currentFiles = filesRef.current;
    const currentMessages = messagesRef.current;
    const currentAppCode = currentFiles['src/App.jsx'] || currentFiles['App.jsx'] || '';
    const fixPrompt = buildFixPrompt(rawErrorMsg, currentAppCode);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    isGeneratingRef.current = true;
    setIsGenerating(true);

    // Add a subtle status message (not an error)
    const statusMsgId = Date.now();
    setMessages(prev => [
      ...prev,
      { role: 'system', content: '\u26a1 Optimizing application in background…', _id: statusMsgId },
    ]);

    try {
      let conversionNeeded = false;

      await streamGenerateWebsite({
        apiKey: apiKeyRef.current,
        model: selectedModelRef.current,
        messages: [...currentMessages, { role: 'user', content: fixPrompt }],
        currentFiles,
        signal: abortControllerRef.current.signal,
        onChunk: (delta, fullText) => {
          const lines = fullText.split('\n');
          const lastLine = lines.slice(-2).find(l => l.trim().length > 0) || '';
          const fileMatch = fullText.match(/<<<FILE:\s*([^\r\n>]+)/g);
          const activeFile = fileMatch 
            ? fileMatch[fileMatch.length - 1].replace(/<<<FILE:\s*/, '').replace(/>>>/, '').trim() 
            : 'src/App.jsx';

          setTelemetry({
            status: 'streaming',
            tokens: Math.round(fullText.length / 3.8),
            bytes: fullText.length,
            latestLine: lastLine.trim().slice(0, 95),
            activeFile,
            parsedFilesCount: fileMatch ? fileMatch.length : 1,
          });
        },
        onFileParsed: (parsedResult) => {
          const { merged, needsConversion } = mergeFiles(parsedResult, filesRef.current);
          if (needsConversion) { conversionNeeded = true; return; }
          if (Object.keys(merged).length > 0) setFiles(merged);
        },
        onComplete: (fullText, finalResult) => {
          let { merged, needsConversion } = mergeFiles(finalResult, filesRef.current);
          if (!needsConversion && Object.keys(merged).length > 0) {
            merged = ensureStandardReactStructure(merged);
            setFiles(merged);
          }

          // Replace the status message with success (silent — no visible change to user)
          setMessages(prev => prev.filter(m => m._id !== statusMsgId));
          isGeneratingRef.current = false;
          setIsGenerating(false);
          onRefresh();

          if (needsConversion) {
            // Trigger another round to get React output
            setTimeout(() => executeAutoFix('Output was HTML, convert to React', false), 500);
          }
        },
        onError: (err) => {
          setMessages(prev => prev.filter(m => m._id !== statusMsgId));
          isGeneratingRef.current = false;
          setIsGenerating(false);
          console.error('[BTS Auto-fix error]', err.message);
        },
      });
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== statusMsgId));
      isGeneratingRef.current = false;
      setIsGenerating(false);
      console.error('[BTS Auto-fix caught]', err.message);
    }
  }, [apiKeyRef, selectedModelRef, filesRef, messagesRef, setFiles, setMessages, setIsGenerating, onRefresh, mergeFiles]);

  /**
   * Main user-triggered generation.
   */
  const handleSendMessage = useCallback(async (userPrompt, enginePrompt = null) => {
    if (!apiKey) return false; // caller should open settings

    autoFixCountRef.current = 0;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    isGeneratingRef.current = true;

    // Display clean user prompt in the chat bubble
    const newMessages = [...messagesRef.current, { role: 'user', content: userPrompt }];
    setMessages(newMessages);
    setIsGenerating(true);

    // Enhance prompt for the AI model if needed
    const promptToSend = enginePrompt || enhanceUserPrompt(userPrompt);
    const messagesForEngine = [
      ...messagesRef.current,
      { role: 'user', content: promptToSend }
    ];

    setTelemetry({
      status: 'connecting',
      tokens: 0,
      bytes: 0,
      latestLine: 'Awaiting first token from OpenRouter gateway...',
      activeFile: 'src/App.jsx',
      parsedFilesCount: 0,
    });

    try {
      let conversionNeeded = false;

      await streamGenerateWebsite({
        apiKey,
        model: selectedModel,
        messages: messagesForEngine,
        currentFiles: filesRef.current,
        signal: abortControllerRef.current.signal,
        onChunk: (delta, fullText) => {
          const lines = fullText.split('\n');
          const lastLine = lines.slice(-2).find(l => l.trim().length > 0) || '';
          const fileMatch = fullText.match(/<<<FILE:\s*([^\r\n>]+)/g);
          const activeFile = fileMatch 
            ? fileMatch[fileMatch.length - 1].replace(/<<<FILE:\s*/, '').replace(/>>>/, '').trim() 
            : 'src/App.jsx';

          setTelemetry({
            status: 'streaming',
            tokens: Math.round(fullText.length / 3.8),
            bytes: fullText.length,
            latestLine: lastLine.trim().slice(0, 95),
            activeFile,
            parsedFilesCount: fileMatch ? fileMatch.length : 1,
          });
        },
        onFileParsed: (parsedResult) => {
          const { merged, needsConversion } = mergeFiles(parsedResult, filesRef.current);
          if (needsConversion) { conversionNeeded = true; return; }
          if (Object.keys(merged).length > 0) setFiles(merged);
        },
        onComplete: (fullText, finalResult) => {
          let { merged, needsConversion } = mergeFiles(finalResult, filesRef.current);

          const hasAppJsx = Boolean(merged['src/App.jsx'] || merged['App.jsx']);
          if (!needsConversion && Object.keys(merged).length > 0) {
            merged = ensureStandardReactStructure(merged);
            setFiles(merged);

            // If src/App.jsx was completely omitted by model, automatically repair in background
            if (!hasAppJsx) {
              setTimeout(() => {
                executeAutoFix('src/App.jsx was omitted during generation. Please synthesize the complete src/App.jsx component.', false);
              }, 400);
            }
          }

          // Build clean reply text — never leak raw code, tool-call tokens, or filenames
          let replyText = fullText;
          if (replyText.includes('<<<FILE:')) {
            replyText = replyText.split('<<<FILE:')[0].trim();
          } else if (replyText.includes('```')) {
            replyText = replyText.split('```')[0].trim();
          }

          // Strip tool call artifacts, model tokens, and leaked headers
          replyText = replyText
            .replace(/<\|[\s\S]*?\|>/g, '')
            .replace(/\[\s*write\s*\([\s\S]*?\)\s*\]/gi, '')
            .replace(/write\s*\(\s*(?:file|filename)[\s\S]*?\)/gi, '')
            .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
            .replace(/<tool_call>/gi, '')
            .trim();

          if (/^(?:#{1,4}|\*\*|File:?)\s*(?:[0-9]+[:.]\s*)?[\w./-]+\*?:?$/i.test(replyText)) {
            replyText = '';
          }
          if (replyText.startsWith('[') || replyText.startsWith('<|') || replyText.includes('import React')) {
            replyText = '';
          }

          const fileNamesList = Object.keys(merged);
          const filesCount = fileNamesList.length;
          if (!replyText || replyText.length < 5) {
            replyText = filesCount > 0
              ? (filesCount > 1 
                  ? `Synthesized modular application with ${filesCount} files (${fileNamesList.join(', ')}). Your project is live in the preview and explorer.`
                  : 'Application ready. Your project is live in the preview and explorer.')
              : 'Synthesis complete.';
          }

          setMessages(prev => [...prev, { role: 'ai', content: replyText }]);
          setTelemetry(prev => ({
            ...prev,
            status: 'compiling',
            latestLine: 'Mounting application into sandboxed React 18 virtual DOM...'
          }));
          isGeneratingRef.current = false;
          setIsGenerating(false);
          onRefresh();

          if (needsConversion) {
            setTimeout(() => executeAutoFix('Output was HTML, convert to React', false), 500);
          }
        },
        onError: (err) => {
          const friendly = getFriendlyMessage(err.message);
          const recoverable = isRecoverable(err.message);

          isGeneratingRef.current = false;
          setIsGenerating(false);
          setTelemetry({
            status: 'idle',
            tokens: 0,
            bytes: 0,
            latestLine: '',
            activeFile: 'src/App.jsx',
            parsedFilesCount: 0,
          });

          if (friendly && !recoverable) {
            // Only show non-recoverable errors (auth, network) — everything else silent
            setMessages(prev => [...prev, { role: 'ai', content: friendly }]);
          }
          console.error('[Generation error]', err.message);
        },
      });
    } catch (err) {
      isGeneratingRef.current = false;
      setIsGenerating(false);
      setTelemetry({
        status: 'idle',
        tokens: 0,
        bytes: 0,
        latestLine: '',
        activeFile: 'src/App.jsx',
        parsedFilesCount: 0,
      });
      console.error('[handleSendMessage caught]', err.message);
    }

    return true;
  }, [apiKey, selectedModel, filesRef, messagesRef, setFiles, setMessages, setIsGenerating, onRefresh, mergeFiles, executeAutoFix]);

  return {
    handleSendMessage,
    handleCancelGeneration,
    executeAutoFix,
    abortControllerRef,
    autoFixCountRef,
    telemetry,
  };
}
