import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_HISTORY_LENGTH = 50;

/**
 * Compare two file dictionaries for deep equality to prevent redundant history entries.
 */
function areFilesEqual(filesA, filesB) {
  if (!filesA || !filesB) return false;
  const keysA = Object.keys(filesA);
  const keysB = Object.keys(filesB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (filesA[key] !== filesB[key]) return false;
  }
  return true;
}

/**
 * useFileHistory
 * Manages an undo/redo stack for workspace files with Ctrl+Z / Ctrl+Y shortcuts.
 */
export function useFileHistory(initialFiles = {}, onFilesRestored) {
  const [history, setHistory] = useState(() => [
    { files: initialFiles, label: 'Initial State', timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onFilesRestoredRef = useRef(onFilesRestored);
  useEffect(() => {
    onFilesRestoredRef.current = onFilesRestored;
  }, [onFilesRestored]);

  const historyRef = useRef(history);
  historyRef.current = history;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  /**
   * Push a new snapshot to history.
   */
  const pushSnapshot = useCallback((newFiles, label = 'Modified Files') => {
    if (!newFiles || typeof newFiles !== 'object') return;

    const currentFiles = historyRef.current[currentIndexRef.current]?.files;
    if (currentFiles && areFilesEqual(currentFiles, newFiles)) {
      return; // Skip duplicate states
    }

    setHistory((prev) => {
      const activeStack = prev.slice(0, currentIndexRef.current + 1);
      const updated = [
        ...activeStack,
        { files: { ...newFiles }, label, timestamp: Date.now() }
      ];
      // Limit history to MAX_HISTORY_LENGTH
      if (updated.length > MAX_HISTORY_LENGTH) {
        return updated.slice(updated.length - MAX_HISTORY_LENGTH);
      }
      return updated;
    });

    setCurrentIndex((prev) => {
      const nextIdx = Math.min(prev + 1, MAX_HISTORY_LENGTH - 1);
      return nextIdx;
    });
  }, []);

  /**
   * Step backward in history.
   */
  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      const targetIndex = currentIndexRef.current - 1;
      const targetSnapshot = historyRef.current[targetIndex];
      if (targetSnapshot) {
        setCurrentIndex(targetIndex);
        onFilesRestoredRef.current?.(targetSnapshot.files);
        return targetSnapshot.files;
      }
    }
    return null;
  }, []);

  /**
   * Step forward in history.
   */
  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      const targetIndex = currentIndexRef.current + 1;
      const targetSnapshot = historyRef.current[targetIndex];
      if (targetSnapshot) {
        setCurrentIndex(targetIndex);
        onFilesRestoredRef.current?.(targetSnapshot.files);
        return targetSnapshot.files;
      }
    }
    return null;
  }, []);

  /**
   * Clear and re-initialize history.
   */
  const clearHistory = useCallback((newInitialFiles = {}) => {
    setHistory([{ files: { ...newInitialFiles }, label: 'Initial State', timestamp: Date.now() }]);
    setCurrentIndex(0);
  }, []);

  // Register global keyboard shortcuts for Ctrl+Z and Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't intercept if typing inside an input, textarea, or contentEditable element
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      // Ctrl+Shift+Z or Ctrl+Y -> Redo
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'z' && !e.shiftKey) {
        // Ctrl+Z -> Undo
        e.preventDefault();
        undo();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const currentSnapshot = history[currentIndex] || null;

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushSnapshot,
    clearHistory,
    historyLength: history.length,
    currentIndex,
    currentSnapshot
  };
}
