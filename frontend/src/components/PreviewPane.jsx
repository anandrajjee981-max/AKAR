import React, { useState, useRef } from 'react';
import { RefreshCw, ExternalLink, Globe, Smartphone, Monitor, Tablet, Eye } from 'lucide-react';

export default function PreviewPane({ previewUrl, onOpenNewTab }) {
  const [key, setKey] = useState(0);
  const [deviceMode, setDeviceMode] = useState('full');
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef(null);

  const handleReload = () => {
    setIsLoading(true);
    setKey(prev => prev + 1);
  };

  const getContainerWidth = () => {
    if (deviceMode === 'mobile') return 'max-w-[390px] shadow-2xl border-x border-zinc-800';
    if (deviceMode === 'tablet') return 'max-w-[768px] shadow-2xl border-x border-zinc-800';
    return 'w-full';
  };

  return (
    <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden h-full">
      {/* Browser Bar */}
      <div className="h-10 bg-[#121215] border-b border-zinc-800 flex items-center justify-between px-3 shrink-0 font-mono">
        <div className="flex items-center space-x-2 flex-1 max-w-xl">
          <button
            onClick={handleReload}
            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition cursor-pointer"
            title="Reload Preview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Address Bar */}
          <div className="flex-1 flex items-center space-x-2 bg-[#09090b] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300">
            <Globe className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <input
              type="text"
              readOnly
              value={previewUrl || 'Preview URL not configured'}
              className="bg-transparent flex-1 outline-none text-zinc-300 select-all truncate text-xs font-mono"
            />
          </div>
        </div>

        {/* Device Modes & Open In New Tab */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center bg-[#09090b] p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setDeviceMode('full')}
              className={`p-1 rounded transition cursor-pointer ${deviceMode === 'full' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-600 hover:text-zinc-300'}`}
              title="Full Width"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1 rounded transition cursor-pointer ${deviceMode === 'tablet' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-600 hover:text-zinc-300'}`}
              title="Tablet Width (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1 rounded transition cursor-pointer ${deviceMode === 'mobile' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-600 hover:text-zinc-300'}`}
              title="Mobile Width (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Open in New Tab Button */}
          <button
            onClick={onOpenNewTab}
            disabled={!previewUrl}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded transition font-medium disabled:opacity-40 cursor-pointer"
            title="Open preview in new tab"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-3 h-3 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Iframe Viewport Container */}
      <div className="flex-1 bg-zinc-950/40 overflow-hidden flex items-center justify-center p-0 relative">
        {previewUrl ? (
          <div className={`h-full transition-all duration-300 flex flex-col bg-[#0d0d12] ${getContainerWidth()}`}>
            <iframe
              ref={iframeRef}
              key={key}
              src={previewUrl}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              className="w-full h-full border-none bg-white"
              title="Application Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 max-w-md font-mono">
            <Eye className="w-10 h-10 mb-3 text-zinc-700" />
            <h3 className="text-xs font-semibold text-zinc-300 mb-1">Preview Target Waiting</h3>
            <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed font-sans">
              Run your application in the Claude Code terminal (e.g. <code>npm run dev</code>). The live web server will render here automatically.
            </p>
            <button
              onClick={onOpenNewTab}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-xs transition cursor-pointer font-mono"
            >
              Open External Preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
