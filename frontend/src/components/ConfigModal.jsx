import React, { useState } from 'react';
import { X, Server, Check, RotateCcw } from 'lucide-react';

export default function ConfigModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetDefaults,
  sandboxId,
  setSandboxId
}) {
  const [formConfig, setFormConfig] = useState(config);
  const [localSandboxId, setLocalSandboxId] = useState(sandboxId || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig(formConfig);
    setSandboxId(localSandboxId);
    onClose();
  };

  const handleReset = () => {
    onResetDefaults();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              AKR Orchestration Endpoints
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs font-mono">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Active Sandbox ID
            </label>
            <input
              type="text"
              value={localSandboxId}
              onChange={(e) => setLocalSandboxId(e.target.value)}
              placeholder="e.g. 70ec9528-76ad-45e0-9bc7-..."
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Sandbox Base URL (POST /api/sandbox/create)
            </label>
            <input
              type="text"
              value={formConfig.sandboxBaseUrl}
              onChange={(e) => setFormConfig({ ...formConfig, sandboxBaseUrl: e.target.value })}
              placeholder="Leave empty for relative (/api/sandbox/create)"
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Agent URL (Files & PTY Socket)
            </label>
            <input
              type="text"
              value={formConfig.agentBaseUrl}
              onChange={(e) => setFormConfig({ ...formConfig, agentBaseUrl: e.target.value })}
              placeholder="e.g. http://<sandboxid>.agent.localhost or http://localhost:3000"
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              AI Service URL (POST /ai/generate)
            </label>
            <input
              type="text"
              value={formConfig.aiBaseUrl}
              onChange={(e) => setFormConfig({ ...formConfig, aiBaseUrl: e.target.value })}
              placeholder="Leave empty for relative (/ai/generate)"
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Live Preview URL
            </label>
            <input
              type="text"
              value={formConfig.previewUrl}
              onChange={(e) => setFormConfig({ ...formConfig, previewUrl: e.target.value })}
              placeholder="e.g. http://<sandboxid>.preview.localhost"
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded transition shadow-sm cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
