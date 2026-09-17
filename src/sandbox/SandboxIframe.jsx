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
export default function SandboxIframe({ files, keyTrigger, onError, onMountSuccess, onPreviewStaged, className }) {
  const [activeSlot, setActiveSlot] = useState('A');
  const activeSlotRef = useRef('A');
  const iframeARef = useRef(null);
  const iframeBRef = useRef(null);
  const lastGoodDocRef = useRef('');
  const pendingDocRef = useRef('');
  const pendingSlotRef = useRef('A');
  const pendingIframeRef = useRef(null);
  const onErrorRef = useRef(onError);
  const onMountSuccessRef = useRef(onMountSuccess);
  const onPreviewStagedRef = useRef(onPreviewStaged);
  const lastEmittedErrorKeyRef = useRef(null);
  const currentPreviewIdRef = useRef(null);
  const lastMountedPreviewIdRef = useRef(null);
  const mountTimeoutRef = useRef(null);

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onMountSuccessRef.current = onMountSuccess;
  }, [onMountSuccess]);

  useEffect(() => {
    onPreviewStagedRef.current = onPreviewStaged;
  }, [onPreviewStaged]);

  useEffect(() => {
    return () => {
      if (mountTimeoutRef.current) {
        clearTimeout(mountTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;

    if (mountTimeoutRef.current) {
      clearTimeout(mountTimeoutRef.current);
      mountTimeoutRef.current = null;
    }

    // 1. Guard against compilation/syntax/semantic errors replacing last-good preview
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
          errorStage: err.errorStage || 'validation',
        });
      }
      return;
    }

    // Clear error tracking once files are valid
    lastEmittedErrorKeyRef.current = null;

    const previewId = 'prev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    currentPreviewIdRef.current = previewId;
    lastMountedPreviewIdRef.current = null;
    onPreviewStagedRef.current?.({ previewId });

    const doc = buildPreviewDoc(files, { previewId });
    if (!doc) return;

    pendingDocRef.current = doc;

    const setupMountTimeout = (targetSlot) => {
      mountTimeoutRef.current = setTimeout(() => {
        if (pendingSlotRef.current && currentPreviewIdRef.current === previewId) {
          const stagingIframe = activeSlotRef.current === 'A' ? iframeBRef.current : iframeARef.current;
          if (stagingIframe && pendingSlotRef.current !== activeSlotRef.current) {
            stagingIframe.srcdoc = 'about:blank';
          }
          pendingSlotRef.current = null;
          pendingIframeRef.current = null;
          onErrorRef.current?.({
            message: 'Preview failed to mount component within timeout or rendered blank.',
            file: 'src/App.jsx',
            errorStage: 'runtime',
          });
        }
      }, 15000);
    };

    // Initial mount: load into active slot
    if (!lastGoodDocRef.current) {
      const currentSlot = activeSlotRef.current;
      pendingSlotRef.current = currentSlot;
      const targetIframe = currentSlot === 'A' ? iframeARef.current : iframeBRef.current;
      pendingIframeRef.current = targetIframe;
      if (targetIframe) {
        targetIframe.srcdoc = doc;
        setupMountTimeout(currentSlot);
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
      setupMountTimeout(stagingSlot);
    }
  }, [files, keyTrigger]);

  useEffect(() => {
    function handleMessage(event) {
      if (!event.data || typeof event.data !== 'object') return;

      const { type, previewId, error, errorStage } = event.data;
      if (type !== 'SANDBOX_MOUNT_SUCCESS' && type !== 'SANDBOX_RUNTIME_ERROR') return;

      console.log('[HOST RECEIVE]', type, previewId, 'CURRENT:', currentPreviewIdRef.current);

      // Stale preview ID check: if message provides a previewId and we have one active, ignore mismatches
      if (previewId && currentPreviewIdRef.current && previewId !== currentPreviewIdRef.current) {
        return;
      }

      const pendingIframe = pendingIframeRef.current;
      const activeIframe = activeSlotRef.current === 'A' ? iframeARef.current : iframeBRef.current;
      const stagingIframe = activeSlotRef.current === 'A' ? iframeBRef.current : iframeARef.current;

      const isFromA = Boolean(iframeARef.current && event.source === iframeARef.current.contentWindow);
      const isFromB = Boolean(iframeBRef.current && event.source === iframeBRef.current.contentWindow);
      const isMatchingPreview = Boolean(previewId && currentPreviewIdRef.current && previewId === currentPreviewIdRef.current);

      if (!isFromA && !isFromB && !isMatchingPreview) {
        // Message does not originate from either sandbox iframe nor match current preview
        return;
      }

      if (mountTimeoutRef.current) {
        clearTimeout(mountTimeoutRef.current);
        mountTimeoutRef.current = null;
      }

      if (type === 'SANDBOX_MOUNT_SUCCESS') {
        const resolvedId = previewId || currentPreviewIdRef.current;
        if (lastMountedPreviewIdRef.current === resolvedId) {
          return;
        }
        lastMountedPreviewIdRef.current = resolvedId;

        if (pendingDocRef.current) {
          lastGoodDocRef.current = pendingDocRef.current;
        }

        // Promote the slot that successfully mounted
        const mountedSlot = isFromB ? 'B' : (isFromA ? 'A' : (pendingSlotRef.current || activeSlotRef.current || 'A'));
        activeSlotRef.current = mountedSlot;
        setActiveSlot(mountedSlot);
        pendingSlotRef.current = null;
        pendingIframeRef.current = null;

        onMountSuccessRef.current?.({ previewId: resolvedId });
      }

      if (type === 'SANDBOX_RUNTIME_ERROR') {
        const normalizedError = typeof error === 'object' && error !== null
          ? { ...error, errorStage: errorStage || error.errorStage || 'runtime' }
          : { message: String(error || 'Runtime sandbox error'), errorStage: errorStage || 'runtime' };

        onErrorRef.current?.(normalizedError);

        const isPendingSource = pendingSlotRef.current === 'A' ? isFromA : (pendingSlotRef.current === 'B' ? isFromB : false);
        const isActiveSource = activeSlotRef.current === 'A' ? isFromA : (activeSlotRef.current === 'B' ? isFromB : false);

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

