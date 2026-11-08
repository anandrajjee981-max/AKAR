import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectCards, Autoplay } from 'swiper/modules';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Terminal as TerminalIcon, 
  Cpu, 
  Zap, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Code2, 
  Box, 
  Activity,
  Server,
  RefreshCw,
  FolderTree,
  ExternalLink,
  Flame,
  Radio,
  Play
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'react-vite',
    title: 'React 19 + Vite + Tailwind',
    subtitle: 'Ultra-fast front-end container with hot module replacement, Tailwind v4 and live browser preview.',
    icon: Code2,
    badge: 'Popular',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    borderColor: 'border-amber-500/50',
    accentColor: 'text-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    metrics: { ram: '512 MB', cpu: '0.5 vCPU', boot: '< 1.8s' },
    tags: ['React 19', 'Tailwind v4', 'Vite', 'Live HMR'],
  },
  {
    id: 'express-agent',
    title: 'Node.js Agent & Virtualized PTY',
    subtitle: 'Containerized Express runtime with Socket.io pseudo-terminal and file virtualization.',
    icon: Server,
    badge: 'High Concurrency',
    gradient: 'from-orange-500/20 via-rose-500/10 to-transparent',
    borderColor: 'border-orange-500/50',
    accentColor: 'text-orange-400',
    glowColor: 'rgba(249, 115, 22, 0.25)',
    metrics: { ram: '1 GB', cpu: '1.0 vCPU', boot: '< 1.4s' },
    tags: ['Node 20', 'Express', 'Socket.io', 'PTY Shell'],
  },
  {
    id: 'fullstack-ai',
    title: 'AKR Autonomous AI Sandbox',
    subtitle: 'Full-stack AI workspace with streaming LLM agents, automated code generation & self-healing.',
    icon: Sparkles,
    badge: 'Agentic Core',
    gradient: 'from-yellow-400/20 via-amber-500/10 to-transparent',
    borderColor: 'border-yellow-500/50',
    accentColor: 'text-yellow-400',
    glowColor: 'rgba(234, 179, 8, 0.25)',
    metrics: { ram: '2 GB', cpu: '2.0 vCPU', boot: '< 2.6s' },
    tags: ['AI Agent', 'LangGraph', 'SSE Stream', 'Auto-Repair'],
  },
];

// Interactive 3D Tilt Card Component
function TiltCard({ template, isSelected }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Icon = template.icon;

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`p-6 rounded-2xl bg-[#0d0d12]/95 border ${template.borderColor} shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all duration-300 group`}
    >
      {/* Background radial glow */}
      <div 
        className="absolute -inset-px opacity-30 group-hover:opacity-60 transition-opacity blur-xl -z-10"
        style={{ background: template.glowColor }}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-4" style={{ transform: 'translateZ(30px)' }}>
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-700/60 shadow-inner">
            <Icon className={`w-6 h-6 ${template.accentColor} transition-transform group-hover:scale-110`} />
          </div>
          <div>
            <h3 className="font-bold text-base text-white tracking-tight">{template.title}</h3>
            <span className={`text-[10px] uppercase tracking-wider font-mono font-bold ${template.accentColor}`}>
              {template.badge}
            </span>
          </div>
        </div>
        <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-300 leading-relaxed mb-5" style={{ transform: 'translateZ(20px)' }}>
        {template.subtitle}
      </p>

      {/* Specs Grid */}
      <div 
        className="grid grid-cols-3 gap-2 py-3 px-3 bg-black/60 border border-zinc-800 rounded-xl text-center mb-5"
        style={{ transform: 'translateZ(25px)' }}
      >
        <div>
          <span className="block text-[10px] text-zinc-500 font-mono">RAM</span>
          <span className="font-mono text-xs font-semibold text-zinc-200">{template.metrics.ram}</span>
        </div>
        <div className="border-x border-zinc-800">
          <span className="block text-[10px] text-zinc-500 font-mono">CPU</span>
          <span className="font-mono text-xs font-semibold text-zinc-200">{template.metrics.cpu}</span>
        </div>
        <div>
          <span className="block text-[10px] text-zinc-500 font-mono">COLD START</span>
          <span className="font-mono text-xs font-semibold text-emerald-400">{template.metrics.boot}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5" style={{ transform: 'translateZ(15px)' }}>
        {template.tags.map((t) => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function AkrDashboard({
  onCreateSandbox,
  isCreating,
  sandboxId,
  onEnterWorkspace,
  onOpenSettings
}) {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [provisioningStep, setProvisioningStep] = useState(0);

  // GSAP entrance reveals
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power4.out' }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 0.25, ease: 'power3.out' }
      );
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.9, delay: 0.45, ease: 'back.out(2)' }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Step progression during sandbox provisioning
  useEffect(() => {
    let interval;
    if (isCreating) {
      setProvisioningStep(1);
      interval = setInterval(() => {
        setProvisioningStep(prev => (prev < 4 ? prev + 1 : prev));
      }, 850);
    } else if (provisioningStep > 0 && sandboxId) {
      setProvisioningStep(4);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#f97316', '#ffffff']
        });
      } catch {
        // ignore
      }
    }
    return () => clearInterval(interval);
  }, [isCreating, sandboxId]);

  const handleLaunchClick = async () => {
    await onCreateSandbox();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#070709] text-[#fafafa] flex flex-col overflow-y-auto overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* High-Impact Ambient Gradient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-amber-500/20 via-orange-600/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute top-1/4 -left-48 w-[450px] h-[450px] bg-amber-600/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-float-slow" />
      <div className="absolute top-1/2 -right-48 w-[450px] h-[450px] bg-orange-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Cyberpunk Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none -z-10" 
        style={{
          backgroundImage: 'radial-gradient(#fafafa 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Top Navbar */}
      <header className="h-16 border-b border-zinc-800/80 px-6 sm:px-12 flex items-center justify-between backdrop-blur-xl bg-zinc-950/70 sticky top-0 z-30">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/40 relative group cursor-pointer">
            <span className="font-black text-sm text-black tracking-wider font-mono">AKAR</span>
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-75 blur transition duration-300 -z-10" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-tight text-white font-mono">AKAR STUDIO</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                v2.4 LIVE
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">Autonomous Cloud Orchestration</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {sandboxId && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onEnterWorkspace}
              className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-amber-500/10"
            >
              <TerminalIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Resume Active Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </motion.button>
          )}

          <button
            onClick={onOpenSettings}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
          >
            Settings
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main ref={heroRef} className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10 max-w-6xl mx-auto w-full z-10">
        
        {/* Viral Pulsing Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center space-x-2.5 bg-zinc-900/90 border border-amber-500/40 px-4 py-1.5 rounded-full text-xs text-amber-300 mb-6 shadow-lg shadow-amber-500/10 backdrop-blur-md"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-semibold tracking-wide font-mono">AUTONOMOUS K8S CONTAINER VIRTUALIZATION</span>
        </motion.div>

        {/* Hero Title with Shifting Gradient */}
        <div ref={titleRef} className="text-center max-w-4xl mb-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08]">
            Supercharge Cloud Apps with{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent animate-gradient-shift">
              AKAR Studio
            </span>
          </h1>
        </div>

        {/* Hero Subtitle */}
        <p ref={subtitleRef} className="text-zinc-400 text-sm sm:text-base text-center max-w-2xl mb-8 leading-relaxed font-sans">
          One-click containerized sandbox environments with virtualized PTY shell, intelligent AI code streaming, live browser preview, and file system synchronization.
        </p>

        {/* Live Metrics Ticker Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 py-2.5 px-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 mb-10 text-xs font-mono shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-zinc-500">K8s Status:</span>
            <span className="text-zinc-200 font-semibold">Active & Healthy</span>
          </div>
          <div className="hidden sm:block text-zinc-700">•</div>
          <div className="flex items-center space-x-2">
            <span className="text-zinc-500">Cold Boot:</span>
            <span className="text-amber-400 font-semibold">&lt; 1.8s</span>
          </div>
          <div className="hidden sm:block text-zinc-700">•</div>
          <div className="flex items-center space-x-2">
            <span className="text-zinc-500">PTY Concurrency:</span>
            <span className="text-zinc-200 font-semibold">Realtime Socket.io</span>
          </div>
        </div>

        {/* Swiper.js 3D Template Showcase Slider */}
        <div className="w-full max-w-2xl mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 text-center flex items-center justify-center space-x-2 font-mono">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Template Configuration</span>
          </div>

          <Swiper
            effect={'cards'}
            grabCursor={true}
            modules={[EffectCards, Pagination, Autoplay]}
            className="w-full max-w-lg py-4"
            pagination={{ clickable: true }}
            onSlideChange={(swiper) => setSelectedTemplate(TEMPLATES[swiper.activeIndex] || TEMPLATES[0])}
          >
            {TEMPLATES.map((tmpl) => (
              <SwiperSlide key={tmpl.id}>
                <TiltCard template={tmpl} isSelected={selectedTemplate.id === tmpl.id} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Viral Animated Primary CTA Button */}
        <div ref={ctaRef} className="flex flex-col items-center space-y-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLaunchClick}
            disabled={isCreating}
            className="relative group px-10 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 shadow-2xl shadow-amber-500/30 border border-amber-200 hover:shadow-amber-500/50 transition-all flex items-center space-x-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 -skew-x-12" />

            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span className="font-mono">Provisioning Container Pod...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-black fill-current" />
                <span className="font-mono tracking-tight text-base">Create Template Environment</span>
                <ArrowRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1.5" />
              </>
            )}
          </motion.button>

          <span className="text-[11px] text-zinc-500 font-mono flex items-center space-x-1">
            <span>Calls</span>
            <code className="text-amber-400/90 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
             
            </code>
            <span>→ Unlocks Workspace & AI Panel</span>
          </span>
        </div>

        {/* Real-time Provisioning Modal Timeline Overlay */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                className="bg-[#0e0e13] border border-amber-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-amber-500/20 text-center relative overflow-hidden"
              >
                {/* Glowing aura */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                  <RefreshCw className="w-7 h-7 animate-spin" />
                </div>
                
                <h3 className="text-lg font-black text-white mb-1 font-mono tracking-tight">
                  Orchestrating Cloud Pod
                </h3>
                <p className="text-xs text-zinc-400 mb-6 font-mono">
                  Targeting Kubernetes API via <span className="text-amber-400">/api/sandbox/create</span>
                </p>

                {/* Provisioning Timeline Steps */}
                <div className="space-y-3.5 text-left mb-6 font-mono text-xs">
                  {[
                    { title: 'Provisioning isolated container pod', step: 1 },
                    { title: 'Establishing Kubernetes service & cluster DNS', step: 2 },
                    { title: 'Initializing AKR PTY shell & Socket stream', step: 3 },
                    { title: 'Connecting AI code generator & preview tunnel', step: 4 },
                  ].map((s) => (
                    <motion.div 
                      key={s.step} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: s.step * 0.15 }}
                      className="flex items-center space-x-3 bg-zinc-950/60 p-2 rounded-lg border border-zinc-900"
                    >
                      {provisioningStep >= s.step ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
                      )}
                      <span className={provisioningStep >= s.step ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
                        {s.title}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="text-[11px] text-zinc-500 font-mono">
                  Auto-redirecting into workspace upon readiness...
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20 w-full max-w-4xl">
          <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md hover:border-amber-500/40 transition group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400 group-hover:scale-110 transition">
              <TerminalIcon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-mono">AKAR Shell</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              High-concurrency pseudo-terminal with live telemetry, CRT scanlines, and instant interactive command execution.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md hover:border-orange-500/40 transition group">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-3 text-orange-400 group-hover:scale-110 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-mono">Autonomous AI Core</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Stream generative code  with real-time SSE chunk updates and direct workspace commitment.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md hover:border-yellow-500/40 transition group">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mb-3 text-yellow-400 group-hover:scale-110 transition">
              <FolderTree className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-mono">Virtual Workspace Tree</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Synchronize directory structures , preview live web servers side-by-side.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-zinc-800/60 px-6 sm:px-12 flex items-center justify-between text-xs text-zinc-500 shrink-0 font-mono">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-zinc-400">AKAR Studio</span>
          <span>• Cohort 2.0 Cloud Orchestration</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>K8s Cluster Ingress Online</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
