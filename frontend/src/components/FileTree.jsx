import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  FileSpreadsheet, 
  RefreshCw, 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  File,
  Code
} from 'lucide-react';

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'html':
      return <Code className="w-4 h-4 text-orange-400 shrink-0" />;
    case 'css':
    case 'scss':
      return <FileSpreadsheet className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-400 shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-zinc-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-zinc-500 shrink-0" />;
  }
}

function buildTree(paths) {
  const root = { name: 'root', isDirectory: true, children: {} };

  paths.forEach(fullPath => {
    const parts = fullPath.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          fullPath: parts.slice(0, index + 1).join('/'),
          isDirectory: !isFile,
          children: isFile ? null : {}
        };
      }
      current = current.children[part];
    });
  });

  function sortNodes(node) {
    if (!node.isDirectory) return node;
    const sortedChildren = Object.values(node.children).sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    return {
      ...node,
      childrenList: sortedChildren.map(sortNodes)
    };
  }

  return sortNodes(root).childrenList || [];
}

function TreeNode({ node, activeFile, onSelectFile, expandedDirs, toggleDir, depth = 0 }) {
  const isExpanded = expandedDirs[node.fullPath];
  const isActive = activeFile === node.fullPath;

  if (node.isDirectory) {
    return (
      <div>
        <div
          onClick={() => toggleDir(node.fullPath)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className="flex items-center space-x-1.5 py-1 px-2 hover:bg-zinc-800/60 rounded cursor-pointer text-xs text-zinc-300 transition-colors select-none group font-mono"
        >
          <span className="text-zinc-600 group-hover:text-zinc-400">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-400/90 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500/70 shrink-0" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </div>

        {isExpanded && node.childrenList && (
          <div>
            {node.childrenList.map(child => (
              <TreeNode
                key={child.fullPath}
                node={child}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
                expandedDirs={expandedDirs}
                toggleDir={toggleDir}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectFile(node.fullPath)}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
      className={`flex items-center space-x-1.5 py-1 px-2 rounded cursor-pointer text-xs transition-colors select-none font-mono ${
        isActive 
          ? 'bg-amber-500/10 text-amber-300 border-l-2 border-amber-500 font-semibold' 
          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
      }`}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </div>
  );
}

export default function FileTree({
  files = [],
  activeFile,
  onSelectFile,
  onRefresh,
  isLoading,
  onCreateNewFile
}) {
  const [search, setSearch] = useState('');
  const [expandedDirs, setExpandedDirs] = useState({});
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    return files.filter(f => f.toLowerCase().includes(search.toLowerCase().trim()));
  }, [files, search]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  const toggleDir = (dirPath) => {
    setExpandedDirs(prev => ({ ...prev, [dirPath]: !prev[dirPath] }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateNewFile(newFileName.trim());
    setNewFileName('');
    setIsCreatingFile(false);
  };

  return (
    <aside className="w-60 lg:w-64 bg-[#0e0e11] border-r border-zinc-800/80 flex flex-col h-full shrink-0 select-none">
      {/* Explorer Header */}
      <div className="h-10 px-3 bg-[#121215] border-b border-zinc-800 flex items-center justify-between font-mono">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Explorer
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsCreatingFile(!isCreatingFile)}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition cursor-pointer"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition cursor-pointer"
            title="Refresh Files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-zinc-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-[#09090b] border border-zinc-800 rounded pl-8 pr-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition font-mono"
          />
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreatingFile && (
        <form onSubmit={handleCreateSubmit} className="p-2 bg-zinc-900/60 border-b border-zinc-800">
          <div className="flex items-center space-x-1">
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. src/App.jsx"
              className="flex-1 bg-black border border-amber-500/50 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded text-xs cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="px-1.5 py-1 text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </form>
      )}

      {/* Tree View List */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {isLoading && files.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500 flex flex-col items-center font-mono">
            <RefreshCw className="w-4 h-4 animate-spin mb-2 text-amber-400" />
            Scanning workspace...
          </div>
        ) : tree.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500 font-mono">
            {search ? 'No matching files found' : 'No workspace files. Create a template to begin.'}
          </div>
        ) : (
          tree.map(node => (
            <TreeNode
              key={node.fullPath}
              node={node}
              activeFile={activeFile}
              onSelectFile={onSelectFile}
              expandedDirs={expandedDirs}
              toggleDir={toggleDir}
              depth={0}
            />
          ))
        )}
      </div>

      {/* Workspace Footer Stat */}
      <div className="h-7 px-3 border-t border-zinc-800 bg-[#09090b] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
        <span>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
        <span className="text-amber-500/70">workspace</span>
      </div>
    </aside>
  );
}
