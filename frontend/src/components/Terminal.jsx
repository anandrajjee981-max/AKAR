import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Trash2, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown, 
  Cpu, 
  Activity, 
  Radio, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Folder,
  Zap,
  Sparkles
} from 'lucide-react';

export default function Terminal({ agentUrl, isCollapsed, onToggleCollapse, sandboxId }) {
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddonInstance = useRef(null);
  const socketRef = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [commandInput, setCommandInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [enableScanlines, setEnableScanlines] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Live telemetry simulation
  const [telemetry, setTelemetry] = useState({
    cpu: '7.4%',
    ram: '384 MB',
    ping: '14ms',
    uptime: '00:04:12'
  });

  // Uptime and telemetry ticker
  useEffect(() => {
    let seconds = 250;
    const interval = setInterval(() => {
      seconds += 1;
      const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      const randCpu = (6 + Math.random() * 4).toFixed(1) + '%';
      const randPing = Math.floor(12 + Math.random() * 8) + 'ms';
      setTelemetry({
        cpu: randCpu,
        ram: '384 MB',
        ping: randPing,
        uptime: `00:${mins}:${secs}`
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const initTerminal = useCallback(() => {
    if (!terminalRef.current) return;

    if (xtermInstance.current) {
      try {
        xtermInstance.current.dispose();
      } catch {
        // ignore
      }
    }
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {
        // ignore
      }
    }

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12.5,
      lineHeight: 1.35,
      theme: {
        background: '#08080a',
        foreground: '#f4f4f5',
        cursor: '#f59e0b',
        cursorAccent: '#08080a',
        selectionBackground: 'rgba(245, 158, 11, 0.35)',
        black: '#18181b',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#fbbf24',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#38bdf8',
        white: '#fafafa',
        brightBlack: '#52525b',
        brightRed: '#ef4444',
        brightGreen: '#22c55e',
        brightYellow: '#f59e0b',
        brightBlue: '#3b82f6',
        brightMagenta: '#a855f7',
        brightCyan: '#06b6d4',
        brightWhite: '#ffffff',
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    xtermInstance.current = term;
    fitAddonInstance.current = fitAddon;

    try {
      fitAddon.fit();
    } catch {
      // ignore
    }

    // High-energy viral terminal banner
    term.writeln('\x1b[38;5;214m╭────────────────────────────────────────────────────────────╮\x1b[0m');
    term.writeln('\x1b[38;5;214m│\x1b[0m  \x1b[1;38;5;220m⚡ Shell v2.4 (Autonomous Cloud Container PTY)\x1b[0m         \x1b[38;5;214m│\x1b[0m');
    term.writeln('\x1b[38;5;214m│\x1b[0m  \x1b[90mKernel:\x1b[0m Linux 6.6-k8s  •  \x1b[90mShell:\x1b[0m bash  •  \x1b[90mStatus:\x1b[0m live stream  \x1b[38;5;214m│\x1b[0m');
    term.writeln('\x1b[38;5;214m╰────────────────────────────────────────────────────────────╯\x1b[0m');
    term.writeln('\x1b[90mConnected to high-concurrency virtualized workspace. Ready for commands.\x1b[0m\r\n');

    setConnectionStatus('connecting');

    const socketUrl = agentUrl || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      term.writeln('\x1b[32m●\x1b[0m \x1b[1mPTY Socket Established\x1b[0m \x1b[90m[session ready]\x1b[0m\r\n');
    });

    socket.on('terminal-ready', () => {
      setConnectionStatus('connected');
    });

    const handleOutput = (data) => {
      if (typeof data === 'string') {
        term.write(data);
      }
    };

    socket.on('terminal-output', handleOutput);
    socket.on('output', handleOutput);

    socket.on('terminal-error', (err) => {
      term.writeln(`\r\n\x1b[31m[error]\x1b[0m ${err?.error || err}\r\n`);
    });

    socket.on('exit', (code) => {
      term.writeln(`\r\n\x1b[33m[process exited with code ${code}]\x1b[0m\r\n`);
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      term.writeln('\r\n\x1b[31m[disconnected from  agent]\x1b[0m\r\n');
    });

    term.onData((data) => {
      if (socket.connected) {
        socket.emit('terminal-input', data);
      }
    });

  }, [agentUrl]);

  useEffect(() => {
    initTerminal();

    const handleResize = () => {
      if (fitAddonInstance.current) {
        try {
          fitAddonInstance.current.fit();
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (socketRef.current) socketRef.current.disconnect();
      if (xtermInstance.current) xtermInstance.current.dispose();
    };
  }, [initTerminal]);

  useEffect(() => {
    if (!isCollapsed && fitAddonInstance.current) {
      setTimeout(() => {
        try {
          fitAddonInstance.current.fit();
        } catch {
          // ignore
        }
      }, 120);
    }
  }, [isCollapsed, isMaximized]);

  const sendCommand = (cmd) => {
    if (!cmd) return;
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('terminal-command', cmd);
    } else if (xtermInstance.current) {
      xtermInstance.current.writeln(`\r\n\x1b[31mTerminal offline. Check container agent connection.\x1b[0m`);
    }
  };

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    sendCommand(commandInput.trim());
    setCommandInput('');
  };

  const handleCopyBuffer = () => {
    if (!xtermInstance.current) return;
    xtermInstance.current.selectAll();
    const selection = xtermInstance.current.getSelection();
    xtermInstance.current.clearSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-[#08080a] border-t border-zinc-800/90 flex flex-col transition-all duration-300 shrink-0 select-none relative ${
      isCollapsed ? 'h-10' : isMaximized ? 'h-full absolute inset-0 z-40' : 'h-72'
    }`}>
      {/* Terminal Header Bar */}
      <div className="h-10 bg-[#0d0d10] border-b border-zinc-800/90 px-3 flex items-center justify-between font-mono">
        {/* Left: Shell Logo, Equalizer Wave, Working Dir */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm shadow-amber-500/10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="tracking-wide text-white">Shell</span>
          </div>

          {/* Micro animated audio/pulse bars */}
          <div className="hidden sm:flex items-center space-x-0.5 px-1 py-0.5" title="Live PTY Stream Active">
            {[4, 8, 14, 6, 12, 16, 8, 10].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: connectionStatus === 'connected' ? [h, Math.max(3, (h * 1.5) % 18), h] : 3 }}
                transition={{ duration: 0.8 + (i * 0.1), repeat: Infinity, ease: 'easeInOut' }}
                className="w-0.5 bg-amber-400/80 rounded-full"
              />
            ))}
          </div>

          {/* Directory Badge */}
          <div className="hidden md:flex items-center space-x-1 text-[11px] text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
            <Folder className="w-3 h-3 text-amber-400/80" />
            <span>~/workspace</span>
          </div>
        </div>

        {/* Right: Live Telemetry & Control Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Live Telemetry Tickers */}
          <div className="hidden lg:flex items-center space-x-3 text-[10px] text-zinc-400 bg-zinc-900/60 px-2.5 py-0.5 rounded border border-zinc-800/80">
            <span className="flex items-center space-x-1 text-zinc-400">
              <Cpu className="w-3 h-3 text-amber-400" />
              <span>{telemetry.cpu}</span>
            </span>
            <span className="border-l border-zinc-800 pl-2 text-zinc-400">
              RAM {telemetry.ram}
            </span>
            <span className="border-l border-zinc-800 pl-2 text-emerald-400 flex items-center space-x-1">
              <Radio className="w-2.5 h-2.5" />
              <span>{telemetry.ping}</span>
            </span>
            <span className="border-l border-zinc-800 pl-2 text-zinc-500 font-mono">
              up {telemetry.uptime}
            </span>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center space-x-1.5 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' :
              connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
            }`} />
            <span className="text-zinc-300 capitalize">{connectionStatus}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 text-zinc-400">
            {/* Scanlines CRT effect toggle */}
            <button
              onClick={() => setEnableScanlines(!enableScanlines)}
              className={`p-1 rounded transition cursor-pointer ${enableScanlines ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-zinc-800 hover:text-zinc-200'}`}
              title="Toggle Retro CRT Scanlines"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Copy Output */}
            <button
              onClick={handleCopyBuffer}
              className="p-1 hover:bg-zinc-800 hover:text-zinc-200 rounded transition cursor-pointer"
              title="Copy Terminal Output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Clear */}
            <button
              onClick={() => xtermInstance.current?.clear()}
              className="p-1 hover:bg-zinc-800 hover:text-zinc-200 rounded transition cursor-pointer"
              title="Clear terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Reconnect */}
            <button
              onClick={initTerminal}
              className="p-1 hover:bg-zinc-800 hover:text-zinc-200 rounded transition cursor-pointer"
              title="Reconnect socket"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Maximize / Restore */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-zinc-800 hover:text-zinc-200 rounded transition cursor-pointer"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Collapse */}
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-zinc-800 hover:text-zinc-200 rounded transition cursor-pointer"
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Viewport */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Optional Scanlines CRT Overlay */}
          {enableScanlines && <div className="absolute inset-0 scanlines-overlay z-10 pointer-events-none" />}

          <div ref={terminalRef} className="flex-1 overflow-hidden" />

          {/* AKR Shell Interactive Command Bar */}
          <div className="bg-[#0d0d10] border-t border-zinc-800/90 px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-mono">
            {/* Quick Interactive Command Chips with Spring animations */}
            <div className="flex items-center space-x-1.5 overflow-x-auto text-[10px]">
              <span className="text-zinc-500 font-semibold select-none flex items-center space-x-1 mr-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Quick:</span>
              </span>
              {[
                { label: 'npm run dev', desc: 'start server' },
                { label: 'ls -la', desc: 'list all' },
                { label: 'git status', desc: 'git' },
                { label: 'npm test', desc: 'tests' },
                { label: 'clear', desc: 'reset' }
              ].map(({ label, desc }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendCommand(label)}
                  className="px-2 py-1 rounded-md bg-zinc-900 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-orange-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/50 transition-all shrink-0 cursor-pointer shadow-sm"
                >
                  <span className="font-semibold">{label}</span>
                </motion.button>
              ))}
            </div>

            {/* CLI Prompt Input */}
            <form onSubmit={handleCommandSubmit} className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="flex items-center space-x-1 text-amber-400 font-bold select-none text-xs">
                <span className="text-zinc-500 text-[10px]">AKAR</span>
                <span>❯</span>
              </div>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type command (e.g. npm run dev) and press Enter..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition placeholder-zinc-600 font-mono"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-md transition font-semibold cursor-pointer shadow-md shadow-amber-500/20"
                title="Execute command in sandbox"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </motion.button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
