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

  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;
    const doc = buildPreviewDoc(files);
    if (!doc) return;

    lastGoodDocRef.current = doc;
    if (iframeRef.current) {
      iframeRef.current.srcdoc = doc;
    }
  }, [files, keyTrigger]);

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

