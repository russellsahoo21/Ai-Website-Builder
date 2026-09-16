"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  X, 
  Eye, 
  EyeOff, 
  Layers, 
  Zap,
  Lock
} from 'lucide-react';
import {
  INTEGRATION_PLATFORMS,
  getAllIntegrations,
  saveIntegration,
  disconnectIntegration,
  testIntegrationConnection,
  subscribeToIntegrations
} from '../services/integrationService.js';

// SVG Brand Logos & Icons
function PlatformIcon({ id, className = "w-6 h-6" }) {
  switch (id) {
    case 'github':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case 'supabase':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M13.4 2.1c-.6-.7-1.7-.3-1.7.6V10H3.9c-.8 0-1.3.9-.9 1.6l8.8 11.2c.6.7 1.7.3 1.7-.6V14h7.8c.8 0 1.3-.9.9-1.6L13.4 2.1z" fill="#3ECF8E" />
        </svg>
      );
    case 'vercel':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 19.5h20L12 2z" />
        </svg>
      );
    case 'netlify':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M16.9 13.7L12 18.6l-4.9-4.9c-.4-.4-1-.4-1.4 0l-2.8 2.8c-.4.4-.4 1 0 1.4l7.7 7.7c.8.8 2.1.8 2.8 0l7.7-7.7c.4-.4.4-1 0-1.4l-2.8-2.8c-.4-.4-1-.4-1.4 0zM7.1 10.3L12 5.4l4.9 4.9c.4.4 1 .4 1.4 0l2.8-2.8c.4-.4.4-1 0-1.4L13.4.4c-.8-.8-2.1-.8-2.8 0L2.9 8.1c-.4.4-.4 1 0 1.4l2.8 2.8c.4.4 1 .4 1.4 0z" fill="#00C7B7" />
        </svg>
      );
    case 'stripe':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.5 12.602.5c-6.177 0-10.286 3.195-10.286 8.528 0 4.195 2.455 6.64 6.84 8.243 2.518.918 3.39 1.678 3.39 2.705 0 .979-.868 1.488-2.327 1.488-2.455 0-5.32-1.127-7.234-2.172l-.934 5.568C3.896 25.5 6.829 26 9.946 26c6.438 0 10.606-3.153 10.606-8.528 0-4.48-2.617-6.726-6.576-8.322z" fill="#635BFF" />
        </svg>
      );
    case 'resend':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
        </svg>
      );
    default:
      return <Zap className={className} />;
  }
}

export default function IntegrationsPage({ navigateTo }) {
  const [integrations, setIntegrations] = useState({});
  const [activePlatform, setActivePlatform] = useState(null);
  const [modalFormData, setModalFormData] = useState({});
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [testState, setTestState] = useState({ testing: false, result: null });
  const [filterCategory, setFilterCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    setIntegrations(getAllIntegrations());
    const unsubscribe = subscribeToIntegrations((updated) => {
      setIntegrations(updated);
    });
    return unsubscribe;
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const platformsList = useMemo(() => {
    return Object.values(INTEGRATION_PLATFORMS);
  }, []);


  const filteredPlatforms = useMemo(() => {
    if (filterCategory === 'All') return platformsList;
    if (filterCategory === 'Connected') return platformsList.filter(p => integrations[p.id]?.connected);
    return platformsList.filter(p => p.category.toLowerCase().includes(filterCategory.toLowerCase()));
  }, [platformsList, integrations, filterCategory]);

  const handleOpenModal = (platform) => {
    const existing = integrations[platform.id] || {};
    setActivePlatform(platform);
    const initial = {};
    platform.fields.forEach(f => {
      initial[f.key] = existing[f.key] || f.defaultValue || '';
    });
    setModalFormData(initial);
    setTestState({ testing: false, result: null });
    setShowPasswordMap({});
  };

  const handleCloseModal = () => {
    setActivePlatform(null);
    setModalFormData({});
    setTestState({ testing: false, result: null });
  };

  const handleTestConnection = async () => {
    if (!activePlatform) return;
    setTestState({ testing: true, result: null });
    const result = await testIntegrationConnection(activePlatform.id, modalFormData);
    setTestState({ testing: false, result });
  };

  const handleSaveIntegration = () => {
    if (!activePlatform) return;
    for (const f of activePlatform.fields) {
      if (f.required && !modalFormData[f.key]?.trim()) {
        setTestState({
          testing: false,
          result: { success: false, message: `Please fill in required field: ${f.label}` }
        });
        return;
      }
    }

    saveIntegration(activePlatform.id, modalFormData);
    showToast(`Successfully connected to ${activePlatform.name}!`);
    handleCloseModal();
  };

  const handleDisconnect = () => {
    if (!activePlatform) return;
    disconnectIntegration(activePlatform.id);
    showToast(`Disconnected from ${activePlatform.name}`);
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 py-12 px-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-emerald-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-10 pb-8 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2.5">
            <Layers className="w-4 h-4" />
            <span>Developer Ecosystem</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2.5">
            Platform Integrations
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-xl leading-relaxed">
            Connect your favorite git providers, serverless databases, edge deployment hosts, and payment gateways directly to the AetherCraft synthesis pipeline.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {['All', 'Connected', 'Version Control', 'Deployment', 'Database', 'Payments', 'Email'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterCategory === cat
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlatforms.map((item) => {
          const config = integrations[item.id] || {};
          const isConnected = Boolean(config.connected);

          return (
            <div
              key={item.id}
              className={`rounded-2xl bg-[#0f1117] border p-6 flex flex-col justify-between transition duration-200 group ${
                isConnected
                  ? 'border-indigo-500/40 shadow-lg shadow-indigo-950/20 bg-gradient-to-b from-[#121520] to-[#0f1117]'
                  : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-[#12141c]'
              }`}
            >
              <div>
                {/* Card Top: Category & Connection Pill */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                    {item.category}
                  </span>
                  {isConnected ? (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5 font-medium shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Connected
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                      Available
                    </span>
                  )}
                </div>

                {/* Card Body: Icon, Title, Description */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isConnected
                      ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400'
                      : 'bg-zinc-800/70 border-zinc-700/50 text-zinc-300'
                  }`}>
                    <PlatformIcon id={item.id} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                      {item.tagline}
                    </p>
                  </div>
                </div>

                {/* Connected Metadata Details */}
                {isConnected && (
                  <div className="mt-4 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                    <span className="truncate max-w-[170px] text-zinc-300 font-mono">
                      {config.username ? `@${config.username}` : (config.url ? config.url.replace('https://', '') : 'Credentials active')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-medium">Active</span>
                  </div>
                )}
              </div>

              {/* Card Bottom: Action Button */}
              <div className="pt-5 mt-5 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">{item.badge}</span>
                <button
                  type="button"
                  onClick={() => handleOpenModal(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isConnected
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 shadow-xs'
                      : 'bg-white hover:bg-zinc-200 text-black shadow-md hover:shadow-indigo-500/10'
                  }`}
                >
                  <span>{isConnected ? 'Configure' : 'Connect'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Connection Modal / Drawer */}
      {activePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div 
            className="w-full max-w-lg bg-[#0e1017] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <PlatformIcon id={activePlatform.id} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Connect {activePlatform.name}</span>
                    <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      {activePlatform.category}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    {activePlatform.tagline}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Security Banner */}
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-zinc-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-indigo-300">Local-First Vault: </span>
                  Your API keys & access tokens are stored securely in your browser workspace. They are never sent to third-party telemetry servers.
                </div>
              </div>

              {/* Dynamic Input Fields */}
              <div className="space-y-4">
                {activePlatform.fields.map((field) => {
                  const isPassword = field.type === 'password';
                  const showPass = showPasswordMap[field.key];
                  const inputType = isPassword ? (showPass ? 'text' : 'password') : field.type;

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-200 font-medium flex items-center gap-1">
                          <span>{field.label}</span>
                          {field.required && <span className="text-indigo-400">*</span>}
                        </label>
                      </div>

                      {field.type === 'select' ? (
                        <select
                          value={modalFormData[field.key] || field.defaultValue}
                          onChange={(e) => setModalFormData({ ...modalFormData, [field.key]: e.target.value })}
                          className="w-full bg-[#13161f] border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                        >
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            type={inputType}
                            value={modalFormData[field.key] || ''}
                            onChange={(e) => setModalFormData({ ...modalFormData, [field.key]: e.target.value })}
                            placeholder={field.placeholder}
                            className={`w-full bg-[#13161f] border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition font-mono text-xs ${
                              isPassword ? 'pr-10' : ''
                            }`}
                          />
                          {isPassword && (
                            <button
                              type="button"
                              onClick={() => setShowPasswordMap({ ...showPasswordMap, [field.key]: !showPass })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      )}

                      {field.helpText && (
                        <p className="text-[11px] text-zinc-500 font-light leading-snug">
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Documentation Helper Link */}
              {activePlatform.docsUrl && (
                <div className="pt-2">
                  <a
                    href={activePlatform.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition group"
                  >
                    <span>Generate credentials on {activePlatform.name} Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </a>
                </div>
              )}

              {/* Live Test Connection Status Readout */}
              {testState.result && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testState.result.success
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                }`}>
                  {testState.result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{testState.result.message}</div>
                    {testState.result.latency && (
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        Latency: {testState.result.latency}ms
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between gap-3">
              <div>
                {integrations[activePlatform.id]?.connected ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={testState.testing}
                    onClick={handleTestConnection}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border border-zinc-700/80"
                  >
                    {testState.testing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Test Connection</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveIntegration}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-indigo-900/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Connect</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
