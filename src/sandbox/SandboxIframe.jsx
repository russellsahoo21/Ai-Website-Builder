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
  const activeSlotRef = useRef('A');
  const iframeARef = useRef(null);
  const iframeBRef = useRef(null);
  const lastGoodDocRef = useRef('');
  const pendingDocRef = useRef('');
  const pendingSlotRef = useRef('A');
  const pendingIframeRef = useRef(null);
  const onErrorRef = useRef(onError);
  const lastEmittedErrorKeyRef = useRef(null);

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;

    // 1. Guard against compilation/syntax errors replacing last-good preview
    const validation = validateProjectFiles(files);
    if (!validation.isValid) {
      const err = validation.errors[0] || { message: 'Compilation error in preview files' };
      const errKey = `${err.file || 'unknown'}:${err.line || 0}:${err.column || 0}:${err.message}`;

      // Prevent infinite loop if onError causes parent to rerender
      if (lastEmittedErrorKeyRef.current !== errKey) {
        lastEmittedErrorKeyRef.current = errKey;
        onErrorRef.current?.({
          message: err.message,
          file: err.file,
          line: err.line,
          column: err.column,
        });
      }
      return;
    }

    // Clear error tracking once files are valid
    lastEmittedErrorKeyRef.current = null;

    const doc = buildPreviewDoc(files);
    if (!doc) return;

    pendingDocRef.current = doc;

    // Initial mount: load into active slot
    if (!lastGoodDocRef.current) {
      const currentSlot = activeSlotRef.current;
      pendingSlotRef.current = currentSlot;
      const targetIframe = currentSlot === 'A' ? iframeARef.current : iframeBRef.current;
      pendingIframeRef.current = targetIframe;
      if (targetIframe) {
        targetIframe.srcdoc = doc;
      }
      return;
    }

    // Staging update: load into background staging slot while keeping active visible
    const stagingSlot = activeSlotRef.current === 'A' ? 'B' : 'A';
    pendingSlotRef.current = stagingSlot;
    const stagingIframe = stagingSlot === 'A' ? iframeARef.current : iframeBRef.current;
    pendingIframeRef.current = stagingIframe;
    if (stagingIframe) {
      stagingIframe.srcdoc = doc;
    }
  }, [files, keyTrigger]);

  useEffect(() => {
    function handleMessage(event) {
      if (!event.data || typeof event.data !== 'object') return;

      const pendingIframe = pendingIframeRef.current;
      const activeIframe = activeSlotRef.current === 'A' ? iframeARef.current : iframeBRef.current;
      const stagingIframe = activeSlotRef.current === 'A' ? iframeBRef.current : iframeARef.current;

      if (event.data.type === 'SANDBOX_MOUNT_SUCCESS') {
        // Strict event.source check: Only accept mount success from the expected pending iframe
        const isExpectedSource = pendingIframe && event.source === pendingIframe.contentWindow;
        if (!isExpectedSource) {
          // Delayed or stale mount message from prior iframe instance — ignore!
          return;
        }

        if (pendingDocRef.current) {
          lastGoodDocRef.current = pendingDocRef.current;
        }
        // Promote staging slot to active once successfully mounted
        if (pendingSlotRef.current) {
          setActiveSlot(pendingSlotRef.current);
          pendingSlotRef.current = null;
          pendingIframeRef.current = null;
        }
      }

      if (event.data.type === 'SANDBOX_RUNTIME_ERROR') {
        const isPendingSource = pendingIframe && event.source === pendingIframe.contentWindow;
        const isActiveSource = activeIframe && event.source === activeIframe.contentWindow;

        // Ignore stale messages from old/destroyed iframe instances
        if (!isPendingSource && !isActiveSource) {
          return;
        }

        onErrorRef.current?.(event.data.error || { message: 'Runtime sandbox error' });

        // If error occurred in staging slot, discard staging without touching active preview
        if (isPendingSource) {
          if (stagingIframe) {
            stagingIframe.srcdoc = 'about:blank';
          }
          pendingSlotRef.current = null;
          pendingIframeRef.current = null;
        } else if (isActiveSource && lastGoodDocRef.current) {
          // If error happened in active iframe, restore last good doc
          if (activeIframe && activeIframe.srcdoc !== lastGoodDocRef.current) {
            activeIframe.srcdoc = lastGoodDocRef.current;
          }
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

