"use client"

import { useState } from "react"
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import type { ProjectFile } from "@/shared/types"

/* ------------------------------------------------------------------ */
/*  FileTree                                                            */
/* ------------------------------------------------------------------ */

interface FileTreeProps {
  files: ProjectFile[]
  selectedPath: string | null
  onSelectFile: (file: ProjectFile) => void
}

export function FileTree({ files, selectedPath, onSelectFile }: FileTreeProps) {
  return (
    <div role="tree" aria-label="Файловое дерево">
      {files.map((file) => (
        <FileTreeItem
          key={file.path}
          file={file}
          depth={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  FileTreeItem (recursive)                                            */
/* ------------------------------------------------------------------ */

interface FileTreeItemProps {
  file: ProjectFile
  depth: number
  selectedPath: string | null
  onSelectFile: (file: ProjectFile) => void
}

function FileTreeItem({
  file,
  depth,
  selectedPath,
  onSelectFile,
}: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isFolder = file.type === "folder"
  const isSelected = !isFolder && selectedPath === file.path

  function handleClick() {
    if (isFolder) {
      setIsOpen((prev) => !prev)
    } else {
      onSelectFile(file)
    }
  }

  return (
    <div role="treeitem" aria-expanded={isFolder ? isOpen : undefined}>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-code transition-colors",
          "hover:bg-muted/50",
          isSelected && "bg-muted text-foreground"
        )}
        style={{ paddingLeft: depth * 12 + 6 }}
      >
        {isFolder ? (
          <>
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-90"
              )}
            />
            {isOpen ? (
              <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="size-3.5 shrink-0 text-muted-foreground" />
            )}
          </>
        ) : (
          <>
            {/* Spacer to align with folder names (ChevronRight width) */}
            <span className="size-3.5 shrink-0" aria-hidden="true" />
            <File className="size-3.5 shrink-0 text-muted-foreground" />
          </>
        )}

        <span className="truncate">{file.name}</span>
      </button>

      {isFolder && isOpen && file.children && (
        <div role="group">
          {file.children.map((child) => (
            <FileTreeItem
              key={child.path}
              file={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}
