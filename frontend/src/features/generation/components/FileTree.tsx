"use client"

import { memo, useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  FileCode2,
  FileText,
  FileJson,
  FileType,
  FolderOpen,
  FolderClosed,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import type { Artifact } from "@/features/generation/types"

// ============================================================================
// Types
// ============================================================================

interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children: FileTreeNode[]
  artifactId?: string
  artifactType?: string
}

interface FileTreeProps {
  artifacts: Artifact[]
  activeArtifactId: string | null
  projectName?: string
  onSelectArtifact: (artifactId: string) => void
  className?: string
}

interface TreeNodeProps {
  node: FileTreeNode
  depth: number
  activeArtifactId: string | null
  expanded: Set<string>
  onToggle: (path: string) => void
  onSelectArtifact: (artifactId: string) => void
}

// ============================================================================
// Constants
// ============================================================================

const FILE_ICONS: Record<string, React.ElementType> = {
  html: FileCode2,
  react: FileCode2,
  vue: FileCode2,
  svelte: FileCode2,
  typescript: FileCode2,
  javascript: FileCode2,
  python: FileCode2,
  css: FileType,
  json: FileJson,
  yaml: FileText,
  toml: FileText,
  ini: FileText,
  markdown: FileText,
  text: FileText,
}

const FILE_COLORS: Record<string, string> = {
  html: "text-orange-400",
  react: "text-cyan-400",
  vue: "text-emerald-400",
  svelte: "text-orange-500",
  typescript: "text-blue-400",
  javascript: "text-yellow-400",
  python: "text-green-400",
  css: "text-purple-400",
  json: "text-yellow-300",
  yaml: "text-red-300",
  toml: "text-amber-300",
  ini: "text-gray-400",
  markdown: "text-gray-400",
  text: "text-gray-400",
}

const EXTENSIONS: Record<string, string> = {
  html: ".html",
  react: ".tsx",
  vue: ".vue",
  svelte: ".svelte",
  typescript: ".ts",
  javascript: ".js",
  python: ".py",
  css: ".css",
  json: ".json",
  yaml: ".yaml",
  toml: ".toml",
  ini: ".ini",
  markdown: ".md",
  text: ".txt",
}

// ============================================================================
// Helpers
// ============================================================================

function getFileName(artifact: Artifact): string {
  if (artifact.title) {
    if (artifact.title.includes(".")) return artifact.title
    return artifact.title + (EXTENSIONS[artifact.type] || "")
  }
  return `artifact-${artifact.id.slice(0, 6)}${EXTENSIONS[artifact.type] || ".txt"}`
}

function getFileIcon(name: string, artifactType?: string): React.ElementType {
  if (artifactType && FILE_ICONS[artifactType]) {
    return FILE_ICONS[artifactType]
  }
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : ""
  const extMap: Record<string, React.ElementType> = {
    py: FileCode2, ts: FileCode2, tsx: FileCode2, js: FileCode2, jsx: FileCode2,
    html: FileCode2, vue: FileCode2, svelte: FileCode2, css: FileType,
    json: FileJson, yaml: FileText, yml: FileText, toml: FileText, md: FileText,
  }
  return (ext && extMap[ext]) || FileText
}

function getFileColor(name: string, artifactType?: string): string {
  if (artifactType && FILE_COLORS[artifactType]) {
    return FILE_COLORS[artifactType]
  }
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : ""
  const extMap: Record<string, string> = {
    py: "text-green-400", ts: "text-blue-400", tsx: "text-cyan-400",
    js: "text-yellow-400", jsx: "text-yellow-400", html: "text-orange-400",
    vue: "text-emerald-400", svelte: "text-orange-500", css: "text-purple-400",
    json: "text-yellow-300", yaml: "text-red-300", yml: "text-red-300",
    toml: "text-amber-300", md: "text-gray-400",
  }
  return (ext && extMap[ext]) || "text-gray-400"
}

function buildTree(artifacts: Artifact[]): FileTreeNode[] {
  const root: FileTreeNode[] = []

  for (const artifact of artifacts) {
    const fileName = getFileName(artifact)
    const parts = fileName.split("/")
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1
      const name = parts[i]
      const path = parts.slice(0, i + 1).join("/")

      let existing = current.find((n) => n.name === name)

      if (!existing) {
        existing = {
          name, path,
          isDirectory: !isLast,
          children: [],
          artifactId: isLast ? artifact.id : undefined,
          artifactType: isLast ? artifact.type : undefined,
        }
        current.push(existing)
      }

      if (!isLast) {
        current = existing.children
      }
    }
  }

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach((n) => sortNodes(n.children))
  }
  sortNodes(root)

  return root
}

function collectAllDirPaths(nodes: FileTreeNode[]): string[] {
  const paths: string[] = []
  for (const node of nodes) {
    if (node.isDirectory) {
      paths.push(node.path)
      paths.push(...collectAllDirPaths(node.children))
    }
  }
  return paths
}

function filterTree(nodes: FileTreeNode[], query: string): FileTreeNode[] {
  const lowerQuery = query.toLowerCase()
  return nodes
    .map((node) => {
      if (node.isDirectory) {
        const filteredChildren = filterTree(node.children, query)
        if (filteredChildren.length > 0) return { ...node, children: filteredChildren }
        return null
      }
      if (node.name.toLowerCase().includes(lowerQuery)) return node
      return null
    })
    .filter(Boolean) as FileTreeNode[]
}

// ============================================================================
// TreeNode component
// ============================================================================

function TreeNode({
  node, depth, activeArtifactId, expanded, onToggle, onSelectArtifact,
}: TreeNodeProps) {
  const paddingLeft = 12 + depth * 12

  if (node.isDirectory) {
    const isExpanded = expanded.has(node.path)
    return (
      <div>
        <button
          onClick={() => onToggle(node.path)}
          className="group flex items-center gap-1.5 w-full h-7 hover:bg-white/[0.04] text-[13px] text-muted-foreground/80 hover:text-foreground/90 transition-colors"
          style={{ paddingLeft }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-400/80 shrink-0" />
          ) : (
            <FolderClosed className="w-4 h-4 text-blue-400/60 shrink-0" />
          )}
          <span className="truncate font-mono text-[12px]">{node.name}</span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="overflow-hidden"
            >
              {node.children.map((child) => (
                <TreeNode
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  activeArtifactId={activeArtifactId}
                  expanded={expanded}
                  onToggle={onToggle}
                  onSelectArtifact={onSelectArtifact}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // File node
  const isActive = node.artifactId === activeArtifactId
  const Icon = getFileIcon(node.name, node.artifactType)
  const color = getFileColor(node.name, node.artifactType)

  return (
    <button
      onClick={() => node.artifactId && onSelectArtifact(node.artifactId)}
      className={cn(
        "flex items-center gap-1.5 w-full h-7 text-[12px] font-mono transition-all duration-150",
        isActive
          ? "bg-white/[0.08] text-foreground border-l-2 border-l-violet-500"
          : "hover:bg-white/[0.04] text-muted-foreground/70 hover:text-foreground/90 border-l-2 border-l-transparent"
      )}
      style={{ paddingLeft: paddingLeft + 14 }}
    >
      <Icon className={cn("w-4 h-4 shrink-0", isActive ? color : `${color} opacity-60`)} />
      <span className="truncate">{node.name}</span>
    </button>
  )
}

// ============================================================================
// FileTree component
// ============================================================================

export const FileTree = memo(function FileTree({
  artifacts,
  activeArtifactId,
  projectName = "project",
  onSelectArtifact,
  className,
}: FileTreeProps) {
  const [search, setSearch] = useState("")
  const [rootOpen, setRootOpen] = useState(true)

  const tree = useMemo(() => buildTree(artifacts), [artifacts])
  const allDirPaths = useMemo(() => collectAllDirPaths(tree), [tree])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allDirPaths))

  useMemo(() => {
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const path of allDirPaths) next.add(path)
      return next
    })
  }, [allDirPaths])

  const toggleDir = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const displayTree = useMemo(() => {
    if (!search.trim()) return tree
    return filterTree(tree, search.trim())
  }, [tree, search])

  if (artifacts.length === 0) {
    return (
      <div className={cn("p-4 text-xs text-muted-foreground/50", className)}>
        <p className="italic">No files</p>
      </div>
    )
  }

  return (
    <div className={cn("select-none flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 shrink-0 border-b border-white/[0.06]">
        <span className="font-medium uppercase tracking-widest text-[10px] text-muted-foreground/50">
          Explorer
        </span>
        <span className="text-[10px] text-muted-foreground/30 tabular-nums">
          {artifacts.length} files
        </span>
      </div>

      {/* Search */}
      {artifacts.length > 3 && (
        <div className="px-2 py-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-7 pr-2 py-1.5 text-[12px] bg-white/[0.04] border border-white/[0.06] rounded-md text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
            />
          </div>
        </div>
      )}

      {/* Root folder */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <button
          onClick={() => setRootOpen(!rootOpen)}
          className="flex items-center gap-1.5 w-full h-7 px-3 hover:bg-white/[0.04] text-[13px] font-medium text-foreground/80 transition-colors"
        >
          {rootOpen ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          )}
          {rootOpen ? (
            <FolderOpen className="w-4 h-4 text-blue-400/80 shrink-0" />
          ) : (
            <FolderClosed className="w-4 h-4 text-blue-400/60 shrink-0" />
          )}
          <span className="truncate font-mono text-[12px]">{projectName}</span>
        </button>

        <AnimatePresence>
          {rootOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="overflow-hidden"
            >
              {displayTree.length > 0 ? (
                displayTree.map((node) => (
                  <TreeNode
                    key={node.path}
                    node={node}
                    depth={1}
                    activeArtifactId={activeArtifactId}
                    expanded={expanded}
                    onToggle={toggleDir}
                    onSelectArtifact={onSelectArtifact}
                  />
                ))
              ) : search.trim() ? (
                <p className="px-4 py-3 text-[12px] text-muted-foreground/40 italic">
                  No matches
                </p>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})
