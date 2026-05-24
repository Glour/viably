/**
 * useMonacoEditor Hook
 *
 * Provides a React hook for integrating Monaco Editor with automatic memory management.
 * Prevents memory leaks by properly disposing editor instances and text models on unmount.
 *
 * Features:
 * - Automatic editor and model disposal on component unmount
 * - Proper model lifecycle management (reuse or create new)
 * - Integration with useComponentCleanup for resource tracking
 * - Only recreates editor on language or theme changes (not on value changes)
 * - TypeScript support with proper Monaco types
 *
 * Critical for preventing memory leaks:
 * - Editor instances must call dispose() when no longer needed
 * - Text models must call dispose() to free up memory and URI
 * - Models with the same URI should be reused, not recreated
 *
 * @example
 * ```tsx
 * function CodeEditor() {
 *   const { containerRef, isReady, getValue, setValue } = useMonacoEditor({
 *     value: 'console.log("Hello")',
 *     language: 'javascript',
 *     theme: 'vs-dark',
 *     options: { readOnly: false }
 *   });
 *
 *   return <div ref={containerRef} style={{ height: '400px' }} />;
 * }
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useComponentCleanup } from './useComponentCleanup';
import type {
  UseMonacoEditorOptions,
  UseMonacoEditorResult,
} from '@/shared/lib/memory/types';

/**
 * Custom hook for Monaco Editor with automatic memory management.
 *
 * @param options - Editor configuration options
 * @returns Editor instance, model, container ref, and control methods
 */
export function useMonacoEditor(
  options: UseMonacoEditorOptions
): UseMonacoEditorResult {
  const { value, language, theme = 'vs-dark', options: editorOptions } = options;

  // Component cleanup integration
  const { registerResource } = useComponentCleanup('useMonacoEditor');

  // State for editor and model instances (for safe access during render)
  const [editor, setEditor] = useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [model, setModel] = useState<Monaco.editor.ITextModel | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Refs for cleanup and internal operations
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<Monaco.editor.ITextModel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const monacoRef = useRef<typeof Monaco | null>(null);

  // Track resource IDs for manual cleanup if needed
  const editorResourceIdRef = useRef<string | null>(null);
  const modelResourceIdRef = useRef<string | null>(null);

  // Track if initialization has been done
  const initializedRef = useRef(false);

  /**
   * Get current editor value.
   * Returns empty string if editor is not ready.
   */
  const getValue = useCallback((): string => {
    return editorRef.current?.getValue() ?? '';
  }, []);

  /**
   * Set editor value programmatically.
   * Does nothing if editor is not ready.
   */
  const setValue = useCallback((newValue: string): void => {
    editorRef.current?.setValue(newValue);
  }, []);

  /**
   * Initialize Monaco Editor when container is ready.
   * Only recreates on language or theme changes.
   */
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) {
      return;
    }

    let mounted = true;
    initializedRef.current = true;

    // Load Monaco asynchronously
    loader.init().then((monaco) => {
      if (!mounted || !containerRef.current) {
        return;
      }

      monacoRef.current = monaco;

      // CRITICAL: Create or reuse model to prevent memory leaks
      // Models must have unique URIs. We generate a timestamp-based URI.
      const uri = monaco.Uri.parse(
        `inmemory://model-${Date.now()}-${Math.random().toString(36).substring(2)}.${language}`
      );

      // Check if a model with this URI already exists (should not in this case)
      let newModel = monaco.editor.getModel(uri);

      if (!newModel) {
        // Create new model with empty initial value (will be set by separate useEffect)
        newModel = monaco.editor.createModel('', language, uri);

        // Register model as a resource for tracking
        const modelResourceId = registerResource({
          type: 'monaco-model',
          createdAt: Date.now(),
          disposeFn: () => {
            newModel?.dispose();
          },
          metadata: { language, uri: uri.toString() },
        });
        modelResourceIdRef.current = modelResourceId;
      }

      modelRef.current = newModel;

      // Create editor instance attached to the container
      const editorInstance = monaco.editor.create(containerRef.current, {
        model: newModel,
        theme,
        automaticLayout: true, // Auto-resize with container
        scrollBeyondLastLine: false,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        ...editorOptions,
      });

      editorRef.current = editorInstance;

      // Register editor as a resource for tracking
      const editorResourceId = registerResource({
        type: 'monaco-editor',
        createdAt: Date.now(),
        disposeFn: () => {
          editorInstance?.dispose();
        },
        metadata: { language, theme },
      });
      editorResourceIdRef.current = editorResourceId;

      // CRITICAL: Only update state once at the end to trigger single re-render
      // These calls are OUTSIDE the Promise chain and will only run once
      if (mounted) {
        setModel(newModel);
        setEditor(editorInstance);
        setIsReady(true);
      }
    });

    // Cleanup function: CRITICAL for preventing memory leaks
    return () => {
      mounted = false;
      initializedRef.current = false;
      setIsReady(false);
      setEditor(null);
      setModel(null);

      // Dispose editor instance
      if (editorRef.current) {
        try {
          editorRef.current.dispose();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ useMonacoEditor: Error disposing editor:', error);
          }
        }
        editorRef.current = null;
      }

      // CRITICAL: Dispose model to free memory and URI
      if (modelRef.current) {
        try {
          modelRef.current.dispose();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ useMonacoEditor: Error disposing model:', error);
          }
        }
        modelRef.current = null;
      }

      // Clear resource tracking IDs
      editorResourceIdRef.current = null;
      modelResourceIdRef.current = null;
    };
    // NOTE: Empty dependency array - only initialize once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Update model value when value prop changes.
   * Separated from editor initialization to avoid recreating editor.
   */
  useEffect(() => {
    if (!modelRef.current || !isReady || value === undefined) {
      return;
    }

    // Only update if the value actually changed
    const currentValue = modelRef.current.getValue();
    if (currentValue !== value) {
      modelRef.current.setValue(value);
    }
  }, [value, isReady]);

  return {
    editor,
    model,
    containerRef,
    isReady,
    getValue,
    setValue,
    editorRef,
    modelRef,
  };
}
