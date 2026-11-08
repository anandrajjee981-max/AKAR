import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  ExternalLink, 
  Plus, 
  Settings, 
  RefreshCw, 
  Terminal as TerminalIcon, 
  Code2, 
  Eye, 
  Sparkles, 
  Layers, 
  Save,
  Zap,
  Radio
} from 'lucide-react';

export default function Header({
  sandboxId,
  isCreatingSandbox,
  onCreateSandbox,
  onOpenPreviewTab,
  previewUrl,
  onOpenSettings,
  activeTab,
  setActiveTab,
  showTerminal,
  setShowTerminal,
  activeFile,
  isDirty,
  onSaveFile,
  isSaving,
  onBackToDashboard
}) {
  return (
    <header className="h-14 bg-[#09090c] border-b border-zinc-800/90 px-4 flex items-center justify-between select-none z-20 shrink-0 font-mono">
      {/* Brand & Dashboard Toggle */}
      <div className="flex items-center space-x-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBackToDashboard}
          className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition group cursor-pointer shadow-sm"
          title="Return to AKR Launchpad"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-xs text-black shadow-md shadow-amber-500/20">
            AKAR
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline group-hover:text-amber-300 transition">
            Launchpad
          </span>
        </motion.button>

        {/* Live Sandbox Telemetry Badge */}
        <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800/90 rounded-md px-2.5 py-1 text-xs">
          <span className={`w-2 h-2 rounded-full ${sandboxId ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-zinc-500 text-[10px]">POD:</span>
          <span className="text-zinc-200 font-semibold text-[11px]">
            {sandboxId ? `${sandboxId.substring(0, 8)}...` : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Center View Switches with Framer Motion Animated Slider */}
      <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800/90 relative">
        {[
          { id: 'editor', label: 'Editor', icon: Code2 },
          { id: 'preview', label: 'Preview', icon: Eye },
          { id: 'split', label: 'Split', icon: Layers, hiddenMobile: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer z-10 ${
                tab.hiddenMobile ? 'hidden md:flex' : ''
              } ${isActive ? 'text-black' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg shadow-md shadow-amber-500/25 -z-10"
                />
              )}
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Save File Button */}
        {activeFile && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onSaveFile}
            disabled={isSaving || !isDirty}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              isDirty 
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/30 animate-pulse' 
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
            }`}
            title="Save file to workspace (Ctrl + S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : isDirty ? 'Save *' : 'Saved'}</span>
          </motion.button>
        )}

        {/* Toggle Terminal Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowTerminal(!showTerminal)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            showTerminal
              ? 'bg-zinc-800 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
          title="Toggle AKR Shell"
        >
          <TerminalIcon className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Shell</span>
        </motion.button>

        {/* New Template / Sandbox Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onCreateSandbox}
          disabled={isCreatingSandbox}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          title="Provision New Template Pod via /api/sandbox/create"
        >
          {isCreatingSandbox ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-black" />
          )}
          <span>{isCreatingSandbox ? 'Creating...' : 'New Template'}</span>
        </motion.button>

        {/* Preview Button (Opens in New Tab) */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenPreviewTab}
          disabled={!previewUrl}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-40"
          title={`Open frontend preview in a new tab: ${previewUrl || 'Not ready'}`}
        >
          <span>Preview</span>
          <ExternalLink className="w-3 h-3 text-amber-400" />
        </motion.button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition cursor-pointer"
          title="Configure API Endpoints"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
