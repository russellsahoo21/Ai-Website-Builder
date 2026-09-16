"use client";
import React, { useState } from 'react';
import { X, Key, Cpu, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { AVAILABLE_MODELS, testOpenRouterConnection } from '../services/aiService';

export default function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel
}) {
  const [tempKey, setTempKey] = useState(apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(tempKey);
    localStorage.setItem('aethercraft_openrouter_key', tempKey);
    localStorage.setItem('aethercraft_model', selectedModel);
    onClose();
  };

  const handleTestKey = async () => {
    const isGemini = selectedModel.includes('gemini');
    const isNvidia = selectedModel.includes('nvidia') || selectedModel.includes('deepseek-v4');
    const isGroq = selectedModel.includes('qwen') || selectedModel.includes('groq') || selectedModel.includes('gpt-oss');
    const isXkiro = selectedModel.startsWith('xkiro/');
    const hasDefaultKey = isGemini || isNvidia || isGroq || isXkiro;

    if (!tempKey && !hasDefaultKey) {
      setTestResult({ success: false, msg: 'Please enter an API key first' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      await testOpenRouterConnection(tempKey, selectedModel);
      setTestResult({ success: true, msg: 'API Connection successful! Model ready.' });
    } catch (err) {
      setTestResult({ success: false, msg: err.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-[#11151d] border border-white/10 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>AI Engine Configuration</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Configure your preferred generation model and custom API keys.
        </p>

        {/* API Key Input */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" /> Custom API Key (Optional)
            </span>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 normal-case font-normal"
            >
              Get Keys <ExternalLink className="w-3 h-3" />
            </a>
          </label>
          <input
            type="password"
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            placeholder="sk-xt-... or gsk_... or sk-or-... or nvapi-... or AQ...."
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none transition"
          />
          <p className="text-[11px] text-slate-500 mt-1.5">
            xKiro, Groq LPU, Gemini & NVIDIA NIM defaults are pre-configured. Enter a key to override or for OpenRouter models.
          </p>
        </div>

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Default AI Model
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {AVAILABLE_MODELS.map((model) => (
              <label
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                  selectedModel === model.id
                    ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-medium">{model.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{model.badge}</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold uppercase tracking-wider">
                  Unlocked
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{testResult.msg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleTestKey}
            disabled={testing}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

