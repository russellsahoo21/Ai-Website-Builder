import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useGeneration } from '../../src/hooks/useGeneration.js';

describe('useGeneration hook', () => {
  it('should initialize and execute handleCancelGeneration without throwing ReferenceError', () => {
    const setIsGenerating = vi.fn();
    const setFiles = vi.fn();
    const setMessages = vi.fn();
    const onRefresh = vi.fn();
    const filesRef = { current: {} };
    const messagesRef = { current: [] };
    const apiKeyRef = { current: 'test-key' };
    const selectedModelRef = { current: 'test-model' };

    const { result } = renderHook(() =>
      useGeneration({
        apiKey: 'test-key',
        selectedModel: 'test-model',
        userId: 'user_123',
        filesRef,
        messagesRef,
        apiKeyRef,
        selectedModelRef,
        setFiles,
        setMessages,
        setIsGenerating,
        onRefresh,
      })
    );

    expect(typeof result.current.handleCancelGeneration).toBe('function');

    // Trigger handleCancelGeneration - this previously crashed with ReferenceError: isGeneratingRef is not defined
    act(() => {
      expect(() => {
        result.current.handleCancelGeneration();
      }).not.toThrow();
    });

    expect(setIsGenerating).toHaveBeenCalledWith(false);
    expect(result.current.telemetry.phaseMessage).toBe('Cancelled');
  });
});
