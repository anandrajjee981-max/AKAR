import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  FilePlus, 
  ArrowDownToLine, 
  RefreshCw, 
  AlertCircle, 
  Bot, 
  Cpu, 
  Zap,
  Flame,
  Layers,
  Compass,
  Code2,
  CheckCircle2
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 1,
    title: 'Reading template & workspace',
    desc: 'Inspecting files, Vite configs & Tailwind setup',
    icon: Layers,
  },
  {
    id: 2,
    title: 'Analyzing requirements',
    desc: 'Planning responsive hierarchy & component tree',
    icon: Compass,
  },
  {
    id: 3,
    title: 'Synthesizing Tailwind CSS',
    desc: 'Composing mobile-first grid, flexbox & styles',
    icon: Flame,
  },
  {
    id: 4,
    title: 'Generating React JSX',
    desc: 'Writing self-contained component & interactive state',
    icon: Code2,
  },
  {
    id: 5,
    title: 'Validating & Updating template',
    desc: 'Checking JSX syntax & preparing live preview',
    icon: CheckCircle2,
  },
];

export default function AiPanel({
  onGenerateCode,
  isGenerating,
  generationStatus,
  generatedCode,
  error,
  onApplyToActiveFile,
  onApplyToAppJsx,
  activeFile,
  onCreateFileFromAi
}) {
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(1);
  const [pipelineMessage, setPipelineMessage] = useState('Reading template & project structure...');

  // Update step from SSE backend status
  useEffect(() => {
    if (generationStatus?.step) {
      setPipelineStep(generationStatus.step);
      if (generationStatus.text) {
        setPipelineMessage(generationStatus.text);
      }
    }
  }, [generationStatus]);

  // Smooth client-side step progression as reassurance during generation
  useEffect(() => {
    if (!isGenerating) {
      setPipelineStep(1);
      setPipelineMessage('');
      return;
    }

    setPipelineStep(1);
    setPipelineMessage('Reading workspace template & dependencies...');

    const t1 = setTimeout(() => {
      setPipelineStep((prev) => (prev < 2 ? 2 : prev));
      setPipelineMessage('Analyzing prompt & planning component architecture...');
    }, 1200);

    const t2 = setTimeout(() => {
      setPipelineStep((prev) => (prev < 3 ? 3 : prev));
      setPipelineMessage('Synthesizing mobile-first Tailwind CSS layout...');
    }, 2800);

    const t3 = setTimeout(() => {
      setPipelineStep((prev) => (prev < 4 ? 4 : prev));
      setPipelineMessage('Generating React component JSX & state hooks...');
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isGenerating]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerateCode(prompt.trim());
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const samplePrompts = [
    'Build a modern responsive landing page with mobile hamburger navbar, hero, features grid, and footer',
    'Create a responsive Food Truck menu & booking page with mobile-first cards and catering form',
    'Design a responsive SaaS dashboard hero with interactive statistics grid and dark mode styling',
    'Build a responsive e-commerce product showcase with filter tabs and touch-friendly cards',
  ];

  return (
    <aside className="w-80 lg:w-96 bg-[#08080a] border-l border-zinc-800/90 flex flex-col h-full shrink-0 select-none font-mono">
      {/* Header */}
      <div className="h-10 px-3 bg-[#0d0d10] border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/40 flex items-center justify-center relative">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isGenerating && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase">
            AI Engine
          </span>
        </div>
        <span className="text-[10px] bg-zinc-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
          /ai/generate
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Output Section */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 border-b border-zinc-800/90">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 flex items-center space-x-1.5">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>Streaming Agent Code</span>
            </span>
            {generatedCode && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="px-2 py-0.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition text-xs flex items-center space-x-1 cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </motion.button>
            )}
          </div>

          <div className="flex-1 bg-[#050507] border border-zinc-800/90 rounded-xl p-3 overflow-y-auto font-mono text-xs text-zinc-200 relative selection:bg-amber-500/30">
            {/* Step-by-Step Agent Execution Pipeline */}
            {isGenerating && !generatedCode && (
              <div className="h-full flex flex-col justify-between py-1">
                {/* Status banner */}
                <div className="bg-zinc-900/90 border border-amber-500/30 rounded-xl p-2.5 shadow-lg shadow-amber-500/5 mb-2 shrink-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute" />
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        Agent Active
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Phase {pipelineStep}/5
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 h-full rounded-full"
                      initial={{ width: '15%' }}
                      animate={{ width: `${Math.min(pipelineStep * 20, 95)}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="mt-2 text-[11px] text-zinc-200 flex items-center space-x-1.5 font-sans">
                    <RefreshCw className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                    <span className="truncate font-medium">{pipelineMessage}</span>
                  </div>
                </div>

                {/* Vertical Process Steps */}
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {PIPELINE_STEPS.map((step) => {
                    const isDone = pipelineStep > step.id;
                    const isCurrent = pipelineStep === step.id;
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.id}
                        className={`flex items-start space-x-2.5 p-2 rounded-lg border transition-all duration-300 ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-sm shadow-amber-500/10'
                            : isDone
                            ? 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400'
                            : 'bg-zinc-950/20 border-zinc-900 text-zinc-600 opacity-60'
                        }`}
                      >
                        {/* Step Icon Badge */}
                        <div className="shrink-0 mt-0.5">
                          {isDone ? (
                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            </div>
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center">
                              <RefreshCw className="w-2.5 h-2.5 text-amber-400 animate-spin" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-[9px] text-zinc-500 font-mono">
                              {step.id}
                            </div>
                          )}
                        </div>

                        {/* Step Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[11px] font-semibold ${
                                isCurrent
                                  ? 'text-amber-200'
                                  : isDone
                                  ? 'text-zinc-300'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {step.title}
                            </span>
                            {isDone && (
                              <span className="text-[9px] text-emerald-400 font-mono">Done</span>
                            )}
                            {isCurrent && (
                              <span className="text-[9px] text-amber-400 font-mono animate-pulse">Running</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-tight mt-0.5 font-sans">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer reassurance */}
                <div className="text-[10px] text-zinc-500 text-center font-sans border-t border-zinc-800/60 pt-1.5 shrink-0">
                  Synthesizing mobile-first Tailwind JSX...
                </div>
              </div>
            )}

            {!isGenerating && !generatedCode && !error && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center px-4 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mb-1">
                  <Sparkles className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-xs text-zinc-400 font-bold">Autonomous Agent Ready</p>
                <p className="text-[11px] text-zinc-600 leading-relaxed font-sans">
                  Enter prompt below. AI will generate or refactor code and allow instant one-click commitment into your workspace.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <div className="font-bold mb-0.5">Generation Error</div>
                  <div className="text-[11px] text-rose-300/90 leading-relaxed font-sans">{error}</div>
                </div>
              </div>
            )}

            {generatedCode && (
              <pre className="whitespace-pre-wrap break-words leading-relaxed text-zinc-200 text-[11px]">
                {generatedCode}
              </pre>
            )}
          </div>

          {/* Quick Actions for Generated Code */}
          {generatedCode && (
            <div className="flex flex-col space-y-2 mt-2.5 pt-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onApplyToAppJsx ? onApplyToAppJsx(generatedCode) : onApplyToActiveFile(generatedCode, 'src/App.jsx')}
                className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold rounded-lg text-xs transition shadow-md shadow-amber-500/20 cursor-pointer"
                title="Apply directly to src/App.jsx to update the live preview screen"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>Apply to Live Preview (App.jsx)</span>
              </motion.button>

              <div className="flex items-center space-x-2">
                {activeFile && activeFile !== 'src/App.jsx' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onApplyToActiveFile(generatedCode)}
                    className="flex-1 flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 rounded-lg text-xs font-semibold transition cursor-pointer"
                    title={`Insert into currently open file: ${activeFile}`}
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate">Insert into {activeFile.split('/').pop()}</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCreateFileFromAi(generatedCode)}
                  className="flex-1 flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Save code as new file"
                >
                  <FilePlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save As New</span>
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* Input & Prompt Presets Section */}
        <div className="p-3 flex flex-col shrink-0 bg-[#08080a]">
          {/* Quick Prompt Chips */}
          <div className="mb-2">
            <span className="text-[10px] text-zinc-500 font-bold mb-1.5 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Suggestions:</span>
            </span>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
              {samplePrompts.map((sample, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-full text-left transition cursor-pointer"
                >
                  {sample}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI to generate logic or refactor code..."
              rows={4}
              className="w-full bg-[#050507] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 resize-none transition leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-400 text-black font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Agent Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>Generate Code (Ctrl+Enter)</span>
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </aside>
  );
}
