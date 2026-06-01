import React from 'react';

/**
 * PlanLockBanner — A premium-looking lock UI component.
 *
 * Props:
 *   feature      (string)   — e.g. "Real-time Chat"
 *   description  (string)   — short explanation
 *   requiredPlan (string)   — e.g. "Pro" or "Agency"
 *   onUpgrade    (function) — callback to open upgrade modal
 *   compact      (boolean)  — render a smaller inline version
 */
const PlanLockBanner = ({ feature, description, requiredPlan = 'Pro', onUpgrade, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-slate-900 border border-indigo-500/20 rounded-xl px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white sm:truncate">
            🔒 {feature}
            <span className="block mt-1 w-max sm:inline-block sm:mt-0 sm:ml-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {requiredPlan}
            </span>
          </p>
          {description && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{description}</p>}
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black hover:opacity-90 transition-all cursor-pointer"
          >
            Upgrade
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-slate-900 border border-indigo-500/20 rounded-2xl p-8 flex flex-col items-center text-center shadow-xl">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none" />

      {/* Lock Icon */}
      <div className="relative z-10 w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 shadow-inner">
        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      {/* Title */}
      <h3 className="relative z-10 text-lg font-extrabold text-white mb-2 flex items-center gap-2">
        {feature}
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
          {requiredPlan}
        </span>
      </h3>

      {/* Description */}
      <p className="relative z-10 text-sm text-slate-400 mb-6 max-w-xs leading-relaxed">
        {description || `Upgrade to ${requiredPlan} to unlock this feature and supercharge your workflow.`}
      </p>

      {/* Upgrade CTA */}
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="relative z-10 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:opacity-90 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25 cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
          </svg>
          Upgrade to {requiredPlan}
        </button>
      )}
    </div>
  );
};

export default PlanLockBanner;
