/**
 * Example: useMonacoEditor Hook Usage
 *
 * Demonstrates how to use the useMonacoEditor hook with proper memory management.
 * This example shows:
 * - Basic editor setup
 * - Value synchronization
 * - Manual getValue/setValue operations
 * - Multiple editors with different languages
 */

'use client';

import React, { useState } from 'react';
import { useMonacoEditor } from './useMonacoEditor';

/**
 * Example 1: Basic Monaco Editor
 */
export function BasicMonacoExample() {
  const [code, setCode] = useState('console.log("Hello, Monaco!");');

  const { containerRef, isReady, getValue, setValue } = useMonacoEditor({
    value: code,
    language: 'javascript',
    theme: 'vs-dark',
    options: {
      readOnly: false,
      minimap: { enabled: true },
    },
  });

  const handleGetValue = () => {
    const currentValue = getValue();
    alert(`Current value:\n${currentValue}`);
  };

  const handleSetValue = () => {
    const newValue = '// New code\nfunction hello() {\n  return "world";\n}';
    setValue(newValue);
    setCode(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={handleGetValue}
          disabled={!isReady}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Get Value
        </button>
        <button
          onClick={handleSetValue}
          disabled={!isReady}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          Set Value
        </button>
        <span className="py-2 text-sm">
          {isReady ? '✓ Ready' : '⏳ Loading...'}
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '400px',
          border: '1px solid #ccc',
        }}
      />
    </div>
  );
}

/**
 * Example 2: Multiple Editors (Language Switching)
 */
export function MultiLanguageExample() {
  const [language, setLanguage] = useState<'javascript' | 'typescript' | 'json'>(
    'javascript'
  );

  const codeSnippets = {
    javascript: 'const greeting = "Hello, JavaScript!";',
    typescript: 'const greeting: string = "Hello, TypeScript!";',
    json: '{\n  "greeting": "Hello, JSON!"\n}',
  };

  const { containerRef, isReady } = useMonacoEditor({
    value: codeSnippets[language],
    language,
    theme: 'vs-dark',
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['javascript', 'typescript', 'json'] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            disabled={!isReady}
            className={`px-4 py-2 rounded disabled:opacity-50 ${
              language === lang
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-black'
            }`}
          >
            {lang}
          </button>
        ))}
        <span className="py-2 text-sm">
          {isReady ? '✓ Ready' : '⏳ Loading...'}
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '300px',
          border: '1px solid #ccc',
        }}
      />
    </div>
  );
}

/**
 * Example 3: Readonly Editor with Custom Options
 */
export function ReadonlyMonacoExample() {
  const { containerRef, isReady } = useMonacoEditor({
    value: `// This editor is readonly\n// You cannot edit this code\n\nfunction demo() {\n  return "Read-only editor";\n}`,
    language: 'javascript',
    theme: 'vs-light',
    options: {
      readOnly: true,
      minimap: { enabled: false },
      lineNumbers: 'off',
      scrollBeyondLastLine: false,
      renderLineHighlight: 'none',
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Status: {isReady ? '✓ Ready (Read-only)' : '⏳ Loading...'}
      </p>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '250px',
          border: '1px solid #ccc',
        }}
      />
    </div>
  );
}

/**
 * Example 4: Conditional Mounting/Unmounting (Memory Leak Test)
 */
export function ConditionalMonacoExample() {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShow(!show)}
        className="px-4 py-2 bg-purple-600 text-white rounded"
      >
        {show ? 'Hide Editor' : 'Show Editor'}
      </button>

      {show && <EditorInstance />}

      <p className="text-xs text-gray-500">
        Toggle the editor multiple times to test memory cleanup. Check browser
        DevTools → Memory → Take Heap Snapshot to verify models are disposed.
      </p>
    </div>
  );
}

function EditorInstance() {
  const { containerRef, isReady } = useMonacoEditor({
    value: 'console.log("This editor will be disposed on unmount");',
    language: 'javascript',
    theme: 'vs-dark',
  });

  return (
    <div>
      <p className="text-sm mb-2">
        {isReady ? '✓ Editor Mounted' : '⏳ Loading...'}
      </p>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '200px',
          border: '1px solid #ccc',
        }}
      />
    </div>
  );
}
