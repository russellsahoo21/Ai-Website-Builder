import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  ArrowUpRight, 
  Activity, 
  Cpu, 
  Clock, 
  Layers 
} from 'lucide-react';
import { getPlanConfig } from '../config/plans.js';

export default function UsageAnalyticsWidget({ 
  userProfile, 
  onUpgrade, 
  projectCount = 0,
  usageData: externalUsageData = null,
  userId = null
}) {
  const [internalUsageData, setInternalUsageData] = useState(null);
  const [loading, setLoading] = useState(!externalUsageData);

  useEffect(() => {
    if (externalUsageData) {
      setInternalUsageData(externalUsageData);
      setLoading(false);
      return;
    }
    if (!userProfile && !userId) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    fetch('/api/usage')
      .then(res => res.json())
      .then(data => {
        if (isMounted && !data.error) {
          setInternalUsageData(data);
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [externalUsageData, userId, userProfile]);

  const usageData = externalUsageData || internalUsageData;
  const planId = userProfile?.plan || usageData?.plan || 'free';
  const planConfig = getPlanConfig(planId);
  const isUnlimited = usageData?.isUnlimited || planId === 'pro' || planId === 'enterprise';
  const usedTokens = usageData?.used || 0;
  const tokenCap = isUnlimited ? -1 : (usageData?.total || planConfig.monthlyTokenQuota || 100000);
  const percentUsed = isUnlimited ? 0 : Math.min(100, Math.round((usedTokens / (tokenCap || 1)) * 100));

  const dailyTrend = usageData?.analytics?.dailyTrend || [];
  const modelBreakdown = usageData?.analytics?.modelBreakdown || {};

  return (
    <div className="rounded-2xl bg-[#0c0e14] border border-zinc-800/90 p-4 space-y-4 shadow-xl">
      {/* Header with Plan Badge and Upgrade Action */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-white tracking-tight">Usage & Quotas</h3>
              <span className={`text-[10px] font-mono font-medium px-2 py-0.2 rounded-full ${
                isUnlimited 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' 
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
              }`}>
                {planConfig.name}
              </span>
              {usageData?.dataSyncStatus === 'degraded' && (
                <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.2 rounded">
                  Sync Offline
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              {isUnlimited ? 'Active Subscription • Unlimited Syntheses' : '100k Monthly Free Tier'}
            </p>
          </div>
        </div>

        {onUpgrade && !isUnlimited && (
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black text-xs font-bold transition shadow-md cursor-pointer"
          >
            <span>Upgrade Pro</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Token Quota Progress */}
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Monthly Tokens
            </span>
            <span className="text-zinc-200 font-bold">
              {isUnlimited ? 'Unlimited' : `${percentUsed}%`}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlimited 
                  ? 'bg-emerald-400 w-full' 
                  : percentUsed > 80 
                    ? 'bg-rose-500' 
                    : 'bg-cyan-400'
              }`}
              style={{ width: isUnlimited ? '100%' : `${Math.max(4, percentUsed)}%` }}
            />
          </div>

          <div className="text-[10px] font-mono text-zinc-500">
            {isUnlimited 
              ? `${usedTokens.toLocaleString()} tokens synthesized` 
              : `${usedTokens.toLocaleString()} / ${tokenCap.toLocaleString()} tokens`}
          </div>
        </div>

        {/* Project Capacity */}
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Active Projects
            </span>
            <span className="text-zinc-200 font-bold">
              {projectCount} / {planConfig.maxProjects === Infinity ? '∞' : planConfig.maxProjects}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ 
                width: `${planConfig.maxProjects === Infinity ? 25 : Math.min(100, Math.round((projectCount / planConfig.maxProjects) * 100))}%` 
              }}
            />
          </div>

          <div className="text-[10px] font-mono text-zinc-500">
            {planConfig.maxProjects === Infinity ? 'Unlimited workspace storage' : `${Math.max(0, planConfig.maxProjects - projectCount)} project slots left`}
          </div>
        </div>
      </div>

      {/* Model Breakdown */}
      {Object.keys(modelBreakdown).length > 0 && (
        <div className="pt-2 border-t border-zinc-800/60">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
            <span>Model Distribution</span>
            <Cpu className="w-3 h-3 text-zinc-500" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(modelBreakdown).map(([model, tok]) => (
              <span 
                key={model} 
                className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-800 text-[10px] font-mono text-zinc-300"
              >
                {model}: <span className="text-cyan-400 font-semibold">{Number(tok).toLocaleString()} tok</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
