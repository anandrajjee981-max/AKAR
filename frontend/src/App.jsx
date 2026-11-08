import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import FileTree from './components/FileTree';
import CodeEditor from './components/CodeEditor';
import PreviewPane from './components/PreviewPane';
import Terminal from './components/Terminal';
import AiPanel from './components/AiPanel';
import AkrDashboard from './components/AkrDashboard';
import ConfigModal from './components/ConfigModal';
import Toast from './components/Toast';
import { 
  createSandboxApi, 
  listFilesApi, 
  readFileApi, 
  updateFilesApi, 
  createFileApi, 
  generateAiCodeApi,
  getDefaultEndpoints 
} from './services/api';

export default function App() {
  // Sandbox State
  const [sandboxId, setSandboxId] = useState(() => localStorage.getItem('akr_sandbox_id') || '');
  const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);

  // View Navigation: 'dashboard' or 'workspace'
  // Starts on the beautiful AKR dashboard unless sandbox is already active
  const [viewMode, setViewMode] = useState(() => {
    const savedId = localStorage.getItem('akr_sandbox_id');
    return savedId ? 'workspace' : 'dashboard';
  });

  // Endpoint Configuration
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('akr_sandbox_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.aiBaseUrl || parsed.aiBaseUrl.includes(':3000') || parsed.aiBaseUrl.includes(':3001')) {
          parsed.aiBaseUrl = 'http://localhost:3002';
        }
        return parsed;
      } catch {
        // ignore
      }
    }
    return getDefaultEndpoints(sandboxId);
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // File System State
  const [files, setFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);

  // Layout & View State
  const [activeTab, setActiveTab] = useState('split'); // 'editor', 'preview', 'split'
  const [showTerminal, setShowTerminal] = useState(true);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);

  // AI State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedAiCode, setGeneratedAiCode] = useState('');
  const [aiError, setAiError] = useState(null);
  const [lastAiPrompt, setLastAiPrompt] = useState('');
  const [aiProgressStatus, setAiProgressStatus] = useState(null);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Persist state in localStorage and keep endpoints strictly in sync with sandboxId
  useEffect(() => {
    if (sandboxId) {
      localStorage.setItem('akr_sandbox_id', sandboxId);
      const defaults = getDefaultEndpoints(sandboxId);
      setConfig(prev => {
        if (!prev.agentBaseUrl || !prev.agentBaseUrl.includes(sandboxId)) {
          return {
            ...prev,
            agentBaseUrl: defaults.agentBaseUrl,
            previewUrl: defaults.previewUrl,
          };
        }
        return prev;
      });
    }
  }, [sandboxId]);

  useEffect(() => {
    localStorage.setItem('akr_sandbox_config', JSON.stringify(config));
  }, [config]);

  const updateSandboxEndpoints = useCallback((newSandboxId) => {
    const defaults = getDefaultEndpoints(newSandboxId);
    setConfig(prev => ({
      ...prev,
      agentBaseUrl: defaults.agentBaseUrl,
      previewUrl: defaults.previewUrl,
    }));
  }, []);

  // Fetch File List from Workspace (/list-files)
  const fetchFiles = useCallback(async (agentUrlOverride) => {
    const url = agentUrlOverride !== undefined ? agentUrlOverride : config.agentBaseUrl;
    setIsLoadingFiles(true);
    try {
      const data = await listFilesApi(url);
      if (data && Array.isArray(data.files)) {
        setFiles(data.files);
        if (data.files.length > 0 && (!activeFile || !data.files.includes(activeFile))) {
          loadFile(data.files[0], url);
        }
      }
    } catch (err) {
      console.warn('Failed to list files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [config.agentBaseUrl, activeFile]);

  // Load a single file (/read-file)
  const loadFile = async (filepath, agentUrlOverride) => {
    const url = agentUrlOverride !== undefined ? agentUrlOverride : config.agentBaseUrl;
    setIsLoadingContent(true);
    try {
      const data = await readFileApi(filepath, url);
      let content = '';

      if (data && Array.isArray(data.result) && data.result.length > 0) {
        const item = data.result[0];
        content = item[filepath] !== undefined ? item[filepath] : (Object.values(item)[0] || '');
      } else if (typeof data === 'string') {
        content = data;
      }

      setActiveFile(filepath);
      setFileContent(content);
      setSavedContent(content);
    } catch (err) {
      console.error('Failed to read file:', err);
      addToast(err.response?.data?.error || err.message, 'error', `Error reading ${filepath}`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'workspace') {
      fetchFiles();
    }
  }, [viewMode, fetchFiles]);

  // Create Sandbox (/api/sandbox/create)
  const handleCreateSandbox = async () => {
    setIsCreatingSandbox(true);
    try {
      const data = await createSandboxApi(config.sandboxBaseUrl);
      const newId = data.sandboxid;
      const preview = data.previewUrl || `http://${newId}.preview.localhost`;
      const agent = `http://${newId}.agent.localhost`;

      setSandboxId(newId);
      setConfig(prev => ({
        ...prev,
        previewUrl: preview,
        agentBaseUrl: agent,
      }));

      addToast(
        `Sandbox ${newId.substring(0, 8)}... created successfully!`,
        'success',
        'Template Provisioned'
      );

      // Automatically transition user into workspace
      setTimeout(() => {
        setViewMode('workspace');
        fetchFiles(agent);
      }, 800);
    } catch (err) {
      console.error('Failed to create sandbox:', err);
      addToast(
        err.response?.data?.err || err.response?.data?.message || err.message,
        'error',
        'Sandbox Creation Failed'
      );
    } finally {
      setIsCreatingSandbox(false);
    }
  };

  // Save Active File (/update-files)
  const handleSaveFile = async () => {
    if (!activeFile) return;
    setIsSavingFile(true);
    try {
      await updateFilesApi([
        { filepath: activeFile, content: fileContent }
      ], config.agentBaseUrl);

      setSavedContent(fileContent);
      addToast(`Saved ${activeFile}`, 'success', 'File Updated');
    } catch (err) {
      console.error('Failed to update file:', err);
      addToast(err.response?.data?.error || err.message, 'error', 'Save Failed');
    } finally {
      setIsSavingFile(false);
    }
  };

  // Create New File (/create-file)
  const handleCreateNewFile = async (newPath) => {
    try {
      await createFileApi([
        { filepath: newPath, content: '// ' + newPath + '\n' }
      ], config.agentBaseUrl);

      addToast(`Created file: ${newPath}`, 'success', 'File Created');
      await fetchFiles();
      loadFile(newPath);
    } catch (err) {
      console.error('Failed to create file:', err);
      addToast(err.response?.data?.error || err.message, 'error', 'Creation Failed');
    }
  };

  // Generate Code Using AI (/ai/generate)
  const handleGenerateAi = async (codePrompt) => {
    setIsGeneratingAi(true);
    setAiError(null);
    setGeneratedAiCode('');
    setLastAiPrompt(codePrompt);
    setAiProgressStatus({ step: 1, text: 'Reading template & project structure...' });

    try {
      const result = await generateAiCodeApi(
        codePrompt,
        config.aiBaseUrl,
        (chunk, accumulated) => {
          setGeneratedAiCode(accumulated);
        },
        (status) => {
          if (status && status.step) {
            setAiProgressStatus(status);
          }
        }
      );

      let finalCode = '';
      if (typeof result === 'string') {
        finalCode = result;
      } else if (result?.generatedCode) {
        finalCode = result.generatedCode;
      } else if (result?.code) {
        finalCode = result.code;
      } else if (result?.response) {
        finalCode = typeof result.response === 'string' ? result.response : JSON.stringify(result.response, null, 2);
      }

      if (finalCode) {
        setGeneratedAiCode(finalCode);
      }
      addToast('AI code generated successfully!', 'success', 'Claude Agent');
    } catch (err) {
      console.error('AI generation error:', err);
      const errMsg = err.response?.data?.error || err.message;
      setAiError(errMsg);
      addToast(errMsg, 'error', 'AI Generation Failed');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAiToActiveFile = async (code, targetFileOverride) => {
    const targetFile = targetFileOverride || activeFile || 'src/App.jsx';
    setFileContent(code);
    setActiveFile(targetFile);

    // Immediately save to the sandbox container so Vite HMR updates the live preview
    try {
      await updateFilesApi([
        { filepath: targetFile, content: code }
      ], config.agentBaseUrl);
      setSavedContent(code);
      addToast(`Committed to ${targetFile} — Live preview updating!`, 'success', 'Live Preview Updated');
      await fetchFiles();
    } catch (err) {
      console.warn('Direct save to container failed, loaded in editor:', err);
      addToast(`Applied to editor. Click Save in toolbar to commit.`, 'info', 'Code Applied');
    }
  };

  const handleCreateFileFromAi = async (code, suggestedFilename) => {
    const rawName = lastAiPrompt
      ? lastAiPrompt
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .trim()
          .split(' ')
          .slice(0, 4)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('')
      : 'AiComponent';

    const componentName = rawName || 'AiComponent';
    const filepath = suggestedFilename || `src/${componentName}.jsx`;

    try {
      // 1. Create the new component file
      await createFileApi([
        { filepath, content: code }
      ], config.agentBaseUrl);

      // 2. Also automatically update src/App.jsx so the live preview immediately renders it!
      // If the code is already a complete App component, apply it to App.jsx too.
      // Otherwise, import and render the new component inside App.jsx.
      const appJsxContent = code.includes('export default function App')
        ? code
        : `import React from 'react';\nimport ${componentName} from './${componentName}.jsx';\n\nexport default function App() {\n  return (\n    <main className="min-h-screen bg-zinc-950 text-white">\n      <${componentName} />\n    </main>\n  );\n}\n`;

      try {
        await updateFilesApi([
          { filepath: 'src/App.jsx', content: appJsxContent }
        ], config.agentBaseUrl);
      } catch (appErr) {
        console.warn('Failed to auto-update App.jsx:', appErr);
      }

      addToast(`Created ${filepath} & updated Live Preview!`, 'success', 'Live Preview Updated');
      await fetchFiles();
      loadFile(filepath);
    } catch (err) {
      console.error('Failed to create file from AI:', err);
      addToast(err.response?.data?.error || err.message, 'error', 'Creation Failed');
    }
  };

  // Open Preview in New Tab
  const handleOpenPreviewTab = () => {
    const targetUrl = config.previewUrl || (sandboxId ? `http://${sandboxId}.preview.localhost` : '');
    if (!targetUrl) {
      addToast('No preview URL available. Create a template first.', 'warning', 'Preview Unavailable');
      return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const isDirty = fileContent !== savedContent;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#09090b] text-[#fafafa] select-none font-sans">
      {/* 1. AKR DASHBOARD VIEW (First opens this view) */}
      {viewMode === 'dashboard' ? (
        <AkrDashboard
          onCreateSandbox={handleCreateSandbox}
          isCreating={isCreatingSandbox}
          sandboxId={sandboxId}
          onEnterWorkspace={() => setViewMode('workspace')}
          onOpenSettings={() => setIsConfigOpen(true)}
        />
      ) : (
        /* 2. AKR CLAUDE CODE WORKSPACE & AI PANEL VIEW */
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Top Header */}
          <Header
            sandboxId={sandboxId}
            isCreatingSandbox={isCreatingSandbox}
            onCreateSandbox={handleCreateSandbox}
            onOpenPreviewTab={handleOpenPreviewTab}
            previewUrl={config.previewUrl}
            onOpenSettings={() => setIsConfigOpen(true)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showTerminal={showTerminal}
            setShowTerminal={setShowTerminal}
            activeFile={activeFile}
            isDirty={isDirty}
            onSaveFile={handleSaveFile}
            isSaving={isSavingFile}
            onBackToDashboard={() => setViewMode('dashboard')}
          />

          {/* Main 3-Column Workspace */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Recursive File Tree Explorer */}
            <FileTree
              files={files}
              activeFile={activeFile}
              onSelectFile={(path) => loadFile(path)}
              onRefresh={() => fetchFiles()}
              isLoading={isLoadingFiles}
              onCreateNewFile={handleCreateNewFile}
            />

            {/* Center: Editor / In-Screen Preview + Claude Code Terminal */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#09090b]">
              {/* Middle Top: Active View (Editor, Preview, or Split) */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {activeTab === 'editor' && (
                  <CodeEditor
                    activeFile={activeFile}
                    content={fileContent}
                    onChangeContent={setFileContent}
                    onSave={handleSaveFile}
                    onRevert={() => setFileContent(savedContent)}
                    isDirty={isDirty}
                    isSaving={isSavingFile}
                    isLoading={isLoadingContent}
                  />
                )}

                {activeTab === 'preview' && (
                  <PreviewPane
                    previewUrl={config.previewUrl}
                    onOpenNewTab={handleOpenPreviewTab}
                  />
                )}

                {activeTab === 'split' && (
                  <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 border-r border-zinc-800/80 flex flex-col min-w-0">
                      <CodeEditor
                        activeFile={activeFile}
                        content={fileContent}
                        onChangeContent={setFileContent}
                        onSave={handleSaveFile}
                        onRevert={() => setFileContent(savedContent)}
                        isDirty={isDirty}
                        isSaving={isSavingFile}
                        isLoading={isLoadingContent}
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <PreviewPane
                        previewUrl={config.previewUrl}
                        onOpenNewTab={handleOpenPreviewTab}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Middle Bottom: Claude Code Terminal */}
              {showTerminal && (
                <Terminal
                  agentUrl={config.agentBaseUrl}
                  isCollapsed={isTerminalCollapsed}
                  onToggleCollapse={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                  sandboxId={sandboxId}
                />
              )}
            </div>

            {/* Right: AI Panel (Accessible after template creation) */}
            <AiPanel
              onGenerateCode={handleGenerateAi}
              isGenerating={isGeneratingAi}
              generationStatus={aiProgressStatus}
              generatedCode={generatedAiCode}
              error={aiError}
              onApplyToActiveFile={handleApplyAiToActiveFile}
              onApplyToAppJsx={(code) => handleApplyAiToActiveFile(code, 'src/App.jsx')}
              activeFile={activeFile}
              onCreateFileFromAi={handleCreateFileFromAi}
            />
          </div>
        </div>
      )}

      {/* Configuration & Endpoints Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          addToast('Configuration updated', 'success');
        }}
        onResetDefaults={() => {
          const defaults = getDefaultEndpoints(sandboxId);
          setConfig(defaults);
          addToast('Endpoints reset to defaults', 'info');
        }}
        sandboxId={sandboxId}
        setSandboxId={(id) => {
          setSandboxId(id);
          updateSandboxEndpoints(id);
        }}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
