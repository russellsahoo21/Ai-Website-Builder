"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { buildPreviewDoc } from '../utils/previewBuilder.js';
import { validateProjectFiles } from '../utils/codeValidator.js';

/**
 * SandboxIframe
 * Double-buffered iframe wrapper that:
 * - Keeps the LAST GOOD preview visible during errors and repair cycles
 * - Stages new preview builds off-screen until SANDBOX_MOUNT_SUCCESS is emitted
 * - Discards failed preview attempts without replacing the working preview
 * - Protects against compilation and syntax errors replacing last-good doc
 */
export default function SandboxIframe({ files, keyTrigger, onError, className }) {
  const [activeSlot, setActiveSlot] = useState('A');
  const iframeARef = useRef(null);
  const iframeBRef = useRef(null);
  const lastGoodDocRef = useRef('');
  const pendingDocRef = useRef('');
  const pendingSlotRef = useRef('A');

  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;

    // 1. Guard against compilation/syntax errors replacing last-good preview
    const validation = validateProjectFiles(files);
    if (!validation.isValid) {
      const err = validation.errors[0] || { message: 'Compilation error in preview files' };
      onError?.({
        message: err.message,
        file: err.file,
        line: err.line,
        column: err.column
      });
      // Do NOT update or stage invalid code
      return;
    }

    const doc = buildPreviewDoc(files);
    if (!doc) return;

    pendingDocRef.current = doc;

    // Initial mount: load into active slot
    if (!lastGoodDocRef.current) {
      pendingSlotRef.current = activeSlot;
      const targetIframe = activeSlot === 'A' ? iframeARef.current : iframeBRef.current;
      if (targetIframe) {
        targetIframe.srcdoc = doc;
      }
      return;
    }

    // Staging update: load into background staging slot while keeping active visible
    const stagingSlot = activeSlot === 'A' ? 'B' : 'A';
    pendingSlotRef.current = stagingSlot;
    const stagingIframe = stagingSlot === 'A' ? iframeARef.current : iframeBRef.current;
    if (stagingIframe) {
      stagingIframe.srcdoc = doc;
    }
  }, [files, keyTrigger, activeSlot, onError]);

  useEffect(() => {
    function handleMessage(event) {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'SANDBOX_MOUNT_SUCCESS') {
        if (pendingDocRef.current) {
          lastGoodDocRef.current = pendingDocRef.current;
        }
        // Promote staging slot to active once successfully mounted
        if (pendingSlotRef.current) {
          setActiveSlot(pendingSlotRef.current);
          pendingSlotRef.current = null;
        }
      }

      if (event.data.type === 'SANDBOX_RUNTIME_ERROR') {
        onError?.(event.data.error || { message: 'Runtime sandbox error' });

        // If error occurred during staging, discard staging without touching active preview
        if (pendingSlotRef.current && pendingSlotRef.current !== activeSlot) {
          const stagingIframe = pendingSlotRef.current === 'A' ? iframeARef.current : iframeBRef.current;
          if (stagingIframe) {
            stagingIframe.srcdoc = 'about:blank';
          }
          pendingSlotRef.current = null;
        } else if (lastGoodDocRef.current) {
          // If error happened in active iframe, restore last good doc
          const activeIframe = activeSlot === 'A' ? iframeARef.current : iframeBRef.current;
          if (activeIframe && activeIframe.srcdoc !== lastGoodDocRef.current) {
            activeIframe.srcdoc = lastGoodDocRef.current;
          }
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeSlot, onError]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#090a0f] ${className || ''}`}>
      <iframe
        ref={iframeARef}
        title="Sandbox Preview A"
        sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
        className={`w-full h-full border-0 absolute inset-0 transition-opacity duration-150 ${activeSlot === 'A' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
      />
      <iframe
        ref={iframeBRef}
        title="Sandbox Preview B"
        sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
        className={`w-full h-full border-0 absolute inset-0 transition-opacity duration-150 ${activeSlot === 'B' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
      />
    </div>
  );
}

