"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { buildPreviewDoc } from '../utils/previewBuilder.js';

/**
 * SandboxIframe
 * A smart iframe wrapper that:
 * - Keeps the LAST GOOD preview visible during errors/repair cycles
 * - Silently triggers recovery via onError callback
 * - Never shows the red error box to users
 * - Only updates srcdoc when new valid content is confirmed
 */
export default function SandboxIframe({ files, keyTrigger, onError, className }) {
  const iframeRef = useRef(null);
  const lastGoodDocRef = useRef('');
  const pendingDocRef = useRef('');

  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;
    const doc = buildPreviewDoc(files);
    if (!doc) return;

    pendingDocRef.current = doc;
    if (!lastGoodDocRef.current) {
      lastGoodDocRef.current = doc;
    }

    if (iframeRef.current) {
      iframeRef.current.srcdoc = doc;
    }
  }, [files, keyTrigger]);

  useEffect(() => {
    function handleMessage(event) {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'SANDBOX_MOUNT_SUCCESS') {
        if (pendingDocRef.current) {
          lastGoodDocRef.current = pendingDocRef.current;
        }
      }

      if (event.data.type === 'SANDBOX_RUNTIME_ERROR') {
        onError?.(event.data.error || { message: 'Runtime sandbox error' });
        // Preserve last known-good preview during repair
        if (lastGoodDocRef.current && lastGoodDocRef.current !== pendingDocRef.current && iframeRef.current) {
          iframeRef.current.srcdoc = lastGoodDocRef.current;
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError]);

  return (
    <iframe
      key={keyTrigger}
      ref={iframeRef}
      title="Sandbox Preview"
      sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
      className={`w-full h-full border-0 bg-[#090a0f] ${className || ''}`}
    />
  );
}

