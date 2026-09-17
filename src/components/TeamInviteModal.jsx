import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Send, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Mail
} from 'lucide-react';
import { inviteWorkspaceMember } from '../services/workspaceService.js';

export default function TeamInviteModal({ 
  isOpen, 
  onClose, 
  activeWorkspaceId, 
  workspaceName = 'Team Workspace' 
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor'); // 'admin' | 'editor' | 'viewer'
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    setIsSending(true);
    await inviteWorkspaceMember({
      workspaceId: activeWorkspaceId || 'default',
      email,
      role
    });

    setIsSending(false);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setEmail('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#0f1117] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Invite to Workspace</h3>
              <p className="text-xs text-zinc-400 truncate max-w-xs">{workspaceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        {sentSuccess ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">Invitation Dispatched!</h4>
            <p className="text-xs text-zinc-400">
              An invite link has been generated and emailed to <span className="text-zinc-200">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Teammate's Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Workspace Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'admin', label: 'Admin', desc: 'Manage team & apps' },
                  { id: 'editor', label: 'Editor', desc: 'Create & synthesize' },
                  { id: 'viewer', label: 'Viewer', desc: 'Inspect & preview' }
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      role === r.id 
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-white shadow-sm' 
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-semibold">{r.label}</span>
                    <span className="text-[10px] text-zinc-500 mt-1">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending || !email.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black text-xs font-bold transition shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Send Invite'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
