import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  UserPlus, 
  Check, 
  Users, 
  Sparkles 
} from 'lucide-react';
import { 
  fetchUserWorkspaces, 
  getActiveWorkspaceId, 
  setActiveWorkspaceId 
} from '../services/workspaceService.js';

export default function WorkspaceSwitcher({ 
  userId, 
  onOpenInviteModal, 
  onOpenCreateWorkspace 
}) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUserWorkspaces(userId).then(list => {
      setWorkspaces(list);
      const savedId = getActiveWorkspaceId();
      if (savedId && list.some(w => w.id === savedId)) {
        setActiveId(savedId);
      } else if (list.length > 0) {
        setActiveId(list[0].id);
      }
    });
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  const handleSelectWorkspace = (ws) => {
    setActiveId(ws.id);
    setActiveWorkspaceId(ws.id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 hover:text-white transition group cursor-pointer"
        title="Switch Workspace"
      >
        <Building2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-105 transition-transform" />
        <span className="max-w-[120px] truncate font-medium">
          {activeWorkspace?.name || 'Personal Workspace'}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl bg-[#0e1017] border border-zinc-800 shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-fadeIn space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between border-b border-zinc-800/80 mb-1">
            <span>Workspaces</span>
            <span className="text-cyan-400 font-semibold">{workspaces.length} total</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {workspaces.map(ws => {
              const isSelected = ws.id === activeWorkspace?.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex items-center justify-between group ${
                    isSelected 
                      ? 'bg-cyan-500/10 text-white font-medium border border-cyan-500/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 shrink-0" />
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1 border-t border-zinc-800/80 space-y-0.5">
            {onOpenInviteModal && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenInviteModal();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Invite Team Member...</span>
              </button>
            )}

            {onOpenCreateWorkspace && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateWorkspace();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Workspace...</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
