"use client";
import React, { useState, useEffect } from 'react';
import {
  Bug,
  Sparkles,
  CheckCircle2,
  Send,
  Terminal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  REPORT_TYPES,
  SEVERITY_LEVELS,
  submitFeedbackReport,
  captureSystemDiagnostics
} from '../services/feedbackService.js';

const QUICK_TEMPLATES = [
  {
    label: 'Sandbox Error / Crash',
    type: 'bug',
    severity: 'high',
    title: 'Iframe Sandbox Blank / Compilation Error',
    description: 'The preview iframe went blank or showed an unexpected compilation error during code generation.',
    steps: '1. Enter prompt in Studio\n2. Wait for code stream to finish\n3. Sandbox displays blank or runtime error',
    expected: 'Rendered React component interactive view',
    actual: 'Blank screen or unhandled runtime exception'
  },
  {
    label: 'AI Timeout / 429 Limit',
    type: 'perf',
    severity: 'medium',
    title: 'OpenRouter API Stream Stalled or Timed Out',
    description: 'The generation stream stalled or exceeded timeout limits without completing App.jsx.',
    steps: '1. Click Synthesize\n2. Wait > 60 seconds with no tokens streamed',
    expected: 'Continuous token streaming to completion',
    actual: 'Stream stalled / watchdog triggered'
  },
  {
    label: 'ZIP Export Glitch',
    type: 'bug',
    severity: 'medium',
    title: 'Downloaded ZIP Archive Missing Dependencies',
    description: 'Extracted ZIP archive does not compile when running npm install locally.',
    steps: '1. Click Export ZIP from project card\n2. Unzip folder\n3. Run npm run dev',
    expected: 'Clean start on localhost:5173',
    actual: 'Missing package in package.json'
  },
  {
    label: 'Custom Component Request',
    type: 'feature',
    severity: 'low',
    title: 'Add Pre-built Chart / Data Visualization Component',
    description: 'Requesting addition of lightweight chart or timeline components in the Modular UI library.',
    steps: 'Check Component Library tab in Dashboard',
    expected: 'Interactive Recharts or SVG Chart card available for 1-click copy',
    actual: 'Only StatCard, DataTable, FilterBar currently available'
  }
];

export default function FeedbackView({ userEmail = '', userName = '' }) {
  const [toastMessage, setToastMessage] = useState(null);
  const [showDiagnosticsPreview, setShowDiagnosticsPreview] = useState(false);
  const [diagnostics, setDiagnostics] = useState({});
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'bug',
    severity: 'high',
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    userEmail: userEmail || '',
    userName: userName || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDiagnostics(captureSystemDiagnostics());
  }, []);

  useEffect(() => {
    if (userEmail && !formData.userEmail) {
      setFormData(prev => ({ ...prev, userEmail, userName }));
    }
  }, [userEmail, userName]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApplyTemplate = (tmpl) => {
    setFormData(prev => ({
      ...prev,
      type: tmpl.type,
      severity: tmpl.severity,
      title: tmpl.title,
      description: tmpl.description,
      stepsToReproduce: tmpl.steps,
      expectedBehavior: tmpl.expected,
      actualBehavior: tmpl.actual,
    }));
    showToast(`Applied preset: ${tmpl.label}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a short title for your report');
      return;
    }
    if (!formData.description.trim()) {
      showToast('Please provide a description of what occurred');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReport = await submitFeedbackReport({
        ...formData,
        diagnostics: captureSystemDiagnostics()
      });
      setIsSubmitting(false);
      setSubmittedTicket(newReport);
      showToast('Report submitted! Thank you for helping improve AetherCraft.');
      // Reset form fields
      setFormData({
        type: 'bug',
        severity: 'high',
        title: '',
        description: '',
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: '',
        userEmail: userEmail || '',
        userName: userName || '',
      });
    } catch (err) {
      setIsSubmitting(false);
      showToast(`Submission failed: ${err.message}`);
    }
  };

  const handleResetForNewReport = () => {
    setSubmittedTicket(null);
    setFormData({
      type: 'bug',
      severity: 'high',
      title: '',
      description: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: '',
      userEmail: userEmail || '',
      userName: userName || '',
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-emerald-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1 font-mono">
          <Bug className="w-4 h-4" />
          <span>Developer Support & Bug Tracker</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Report a Bug or Feedback
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Encountered a glitch, synthesis error, or have a suggestion? Let us know below. Our team reviews every submission with attached environment diagnostics.
        </p>
      </div>

      {/* ── SUCCESS CONFIRMATION STATE ── */}
      {submittedTicket ? (
        <div className="p-8 rounded-2xl bg-[#0b0d13] border border-emerald-500/30 text-center space-y-5 animate-fadeIn shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">
              Report Submitted Successfully
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Thank you! Your ticket <code className="text-emerald-300 font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">{submittedTicket.id}</code> and system telemetry have been logged directly into our engineering pipeline.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleResetForNewReport}
              className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition flex items-center gap-2 mx-auto cursor-pointer shadow-md active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Another Report</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── SUBMISSION FORM ── */
        <div className="space-y-6">
          {/* Quick Preset Templates */}
          <div className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800/80">
            <div className="text-xs font-semibold text-zinc-300 mb-2.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Incident Templates</span>
              <span className="text-[10px] text-zinc-500 font-normal">(click to prefill common bug patterns)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="text-left p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer group"
                >
                  <div className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300 transition truncate">
                    {tmpl.label}
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {tmpl.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#0b0d13] border border-zinc-800 space-y-5">
            {/* Category / Type & Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Feedback Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REPORT_TYPES.map((t) => {
                    const isSel = formData.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t.id })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition cursor-pointer flex items-center gap-2 ${
                          isSel
                            ? `${t.color} font-semibold ring-1 ring-white/20 shadow-xs`
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity Level */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Severity / Urgency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SEVERITY_LEVELS.map((s) => {
                    const isSel = formData.severity === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, severity: s.id })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition cursor-pointer flex items-center gap-2 ${
                          isSel
                            ? `${s.badge} ring-1 ring-white/20 shadow-xs font-semibold`
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Issue Summary / Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Export ZIP produces corrupted manifest on Windows..."
                className="w-full h-11 bg-zinc-950/80 border border-zinc-800 focus:border-zinc-600 rounded-xl px-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Detailed Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Provide a thorough explanation of what occurred, what was expected, and any error message you encountered..."
                className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-600 rounded-xl p-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition leading-relaxed"
                required
              />
            </div>

            {/* Two column: Steps & Expected/Actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Steps to Reproduce <span className="text-zinc-500 text-[10px]">(optional)</span>
                </label>
                <textarea
                  value={formData.stepsToReproduce}
                  onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                  rows={3}
                  placeholder="1. Go to Studio&#10;2. Type 'Modern gym tracker'&#10;3. Click Synthesize"
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-600 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Expected vs Actual Behavior <span className="text-zinc-500 text-[10px]">(optional)</span>
                </label>
                <textarea
                  value={formData.actualBehavior}
                  onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
                  rows={3}
                  placeholder="Expected: Live 60 FPS preview in iframe&#10;Actual: Got blank white screen with Babel parser error"
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-600 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Submitter Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Your Email (for updates)
                </label>
                <input
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full h-10 bg-zinc-950/80 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  placeholder="Your Name"
                  className="w-full h-10 bg-zinc-950/80 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* System Diagnostics Collapsible */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDiagnosticsPreview(prev => !prev)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-zinc-300">Auto-Captured System Telemetry</span>
                  <span className="text-[10px] text-zinc-500 font-mono">({diagnostics.os} • {diagnostics.browser})</span>
                </div>
                {showDiagnosticsPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDiagnosticsPreview && (
                <div className="p-4 pt-0 border-t border-zinc-800/60 font-mono text-[11px] text-zinc-400 grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  <div><span className="text-zinc-500">OS:</span> {diagnostics.os}</div>
                  <div><span className="text-zinc-500">Browser:</span> {diagnostics.browser}</div>
                  <div><span className="text-zinc-500">Screen:</span> {diagnostics.screen}</div>
                  <div><span className="text-zinc-500">Viewport:</span> {diagnostics.viewport}</div>
                  <div><span className="text-zinc-500">Model:</span> {diagnostics.activeModel}</div>
                  <div><span className="text-zinc-500">Online:</span> {diagnostics.online ? 'Connected' : 'Offline'}</div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-500">
                Your report will be reviewed by the development team.
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
