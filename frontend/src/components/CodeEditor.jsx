import React, { useState, useEffect, useRef } from 'react';
import { Save, RotateCcw, Copy, Check, FileCode, Code2 } from 'lucide-react';

export default function CodeEditor({
  activeFile,
  content,
  onChangeContent,
  onSave,
  onRevert,
  isDirty,
  isSaving,
  isLoading
}) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (isDirty && !isSaving) {
        onSave();
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      const nextContent = val.substring(0, start) + '  ' + val.substring(end);
      onChangeContent(nextContent);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = (content || '').split('\n');
  const lineCount = lines.length;

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#09090b] text-zinc-500 p-8 select-none font-mono">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-600">
          <Code2 className="w-8 h-8 text-amber-500/40" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-1">Select a File to Inspect</h3>
        <p className="text-xs text-zinc-500 max-w-sm text-center leading-relaxed font-sans">
          Pick a file from the explorer on the left or create a new file to start developing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden h-full">
      {/* Editor Tab & Header */}
      <div className="h-10 bg-[#121215] border-b border-zinc-800 flex items-center justify-between px-3 shrink-0 font-mono">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-[#09090b] border-t-2 border-amber-500 rounded-t text-xs text-zinc-200">
            <span>{activeFile}</span>
            {isDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" title="Unsaved changes" />
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition cursor-pointer"
            title="Copy Content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={onRevert}
            disabled={!isDirty || isSaving}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition disabled:opacity-40 cursor-pointer"
            title="Revert to last saved version"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Revert</span>
          </button>

          <button
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-black rounded font-semibold transition shadow-sm disabled:opacity-40 cursor-pointer"
            title="Save file (Ctrl + S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Gutter */}
      <div className="flex-1 flex overflow-hidden relative font-mono text-xs leading-5">
        {isLoading ? (
          <div className="absolute inset-0 bg-[#09090b]/80 z-10 flex items-center justify-center text-xs text-zinc-400">
            Reading file from workspace...
          </div>
        ) : null}

        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-3 bg-[#0e0e11] border-r border-zinc-800/80 text-right pr-3 select-none text-zinc-600 overflow-hidden shrink-0"
        >
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, idx) => (
            <div key={idx + 1}>{idx + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-zinc-200 resize-none outline-none overflow-y-auto whitespace-pre font-mono leading-5 selection:bg-amber-500/30"
          placeholder="File is empty"
        />
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#121215] border-t border-zinc-800/80 px-3 flex items-center justify-between text-[10px] text-zinc-500 shrink-0 select-none font-mono">
        <div className="flex items-center space-x-3">
          <span>{lineCount} lines</span>
          <span>{content?.length || 0} chars</span>
          {isDirty && <span className="text-amber-400">● Unsaved</span>}
        </div>
        <div className="flex items-center space-x-3">
          <span>UTF-8</span>
          <span>{activeFile.split('.').pop()?.toUpperCase() || 'CODE'}</span>
        </div>
      </div>
    </div>
  );
}
