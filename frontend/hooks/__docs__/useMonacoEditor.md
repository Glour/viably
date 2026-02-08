# useMonacoEditor Hook

## Overview

A React hook that provides Monaco Editor integration with **automatic memory management**. This hook prevents memory leaks by properly disposing editor instances and text models when components unmount.

## Critical Memory Management

Monaco Editor is a **known source of memory leaks** if not properly managed. This hook implements the following safeguards:

1. **Editor Disposal**: Calls `editor.dispose()` on unmount to free resources
2. **Model Disposal**: Calls `model.dispose()` on unmount to free memory and URI
3. **Resource Tracking**: Integrates with `useComponentCleanup` for lifecycle monitoring
4. **Optimized Re-renders**: Only recreates editor on `language` or `theme` changes, not on `value` changes

## Usage

### Basic Example

```tsx
'use client';

import { useMonacoEditor } from '@/hooks/useMonacoEditor';

function CodeEditor() {
  const { containerRef, isReady, getValue, setValue } = useMonacoEditor({
    value: 'console.log("Hello, Monaco!");',
    language: 'javascript',
    theme: 'vs-dark',
    options: {
      readOnly: false,
      minimap: { enabled: true },
    },
  });

  return (
    <div>
      <div ref={containerRef} style={{ height: '400px' }} />
      <button onClick={() => alert(getValue())} disabled={!isReady}>
        Get Value
      </button>
    </div>
  );
}
```

### Controlled Editor with State

```tsx
function ControlledEditor() {
  const [code, setCode] = useState('// Initial code');

  const { containerRef, isReady, setValue } = useMonacoEditor({
    value: code,
    language: 'typescript',
    theme: 'vs-dark',
  });

  const handleInsertSnippet = () => {
    const newCode = code + '\nconsole.log("Inserted");';
    setCode(newCode);
    setValue(newCode); // Optional: setValue is automatically synced with value prop
  };

  return (
    <div>
      <button onClick={handleInsertSnippet} disabled={!isReady}>
        Insert Snippet
      </button>
      <div ref={containerRef} style={{ height: '400px' }} />
    </div>
  );
}
```

### Multiple Editors (Language Switching)

```tsx
function MultiLanguageEditor() {
  const [language, setLanguage] = useState<'javascript' | 'typescript'>('javascript');

  const snippets = {
    javascript: 'const x = 42;',
    typescript: 'const x: number = 42;',
  };

  const { containerRef, isReady } = useMonacoEditor({
    value: snippets[language],
    language,
    theme: 'vs-dark',
  });

  return (
    <div>
      <button onClick={() => setLanguage('javascript')} disabled={!isReady}>
        JavaScript
      </button>
      <button onClick={() => setLanguage('typescript')} disabled={!isReady}>
        TypeScript
      </button>
      <div ref={containerRef} style={{ height: '300px' }} />
    </div>
  );
}
```

## API Reference

### `useMonacoEditor(options: UseMonacoEditorOptions): UseMonacoEditorResult`

#### Options

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `value` | `string` | Yes | - | Initial code content |
| `language` | `string` | Yes | - | Programming language (e.g., 'javascript', 'typescript', 'json') |
| `theme` | `string` | No | `'vs-dark'` | Editor theme ('vs', 'vs-dark', 'hc-black') |
| `options` | `Record<string, unknown>` | No | `{}` | Monaco editor options (IStandaloneEditorConstructionOptions) |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `editor` | `IStandaloneCodeEditor \| null` | Editor instance (null until mounted) |
| `model` | `ITextModel \| null` | Text model instance (null until mounted) |
| `containerRef` | `RefObject<HTMLDivElement>` | Ref to attach to the editor container element |
| `isReady` | `boolean` | Whether the editor is fully initialized |
| `getValue()` | `() => string` | Get current editor content |
| `setValue(value)` | `(value: string) => void` | Set editor content programmatically |

## Memory Management Details

### What Gets Disposed

When the component unmounts or when `language`/`theme` changes:

1. **Editor Instance**: `editor.dispose()` is called to release:
   - DOM event listeners
   - Layout and rendering resources
   - Syntax highlighting workers
   - IntelliSense providers

2. **Text Model**: `model.dispose()` is called to release:
   - Model content from memory
   - Model URI (allows reuse of the same URI)
   - Change listeners and decorations

### Resource Tracking

The hook integrates with `useComponentCleanup`:

```typescript
registerResource({
  type: 'monaco-editor',
  createdAt: Date.now(),
  disposeFn: () => editor?.dispose(),
  metadata: { language, theme },
});

registerResource({
  type: 'monaco-model',
  createdAt: Date.now(),
  disposeFn: () => model?.dispose(),
  metadata: { language, uri: uri.toString() },
});
```

In development mode, warnings are logged if resources are not properly disposed.

## Performance Considerations

### When Editor Recreates

The editor **recreates** only when:
- `language` prop changes
- `theme` prop changes
- `editorOptions` reference changes

### When Editor Does NOT Recreate

The editor **does not recreate** when:
- `value` prop changes (uses `model.setValue()` instead)
- Component re-renders without prop changes

### Optimization Tips

1. **Memoize `editorOptions`**: Use `useMemo` to prevent unnecessary recreation
   ```tsx
   const options = useMemo(() => ({
     readOnly: false,
     minimap: { enabled: true },
   }), []);
   ```

2. **Avoid Frequent Language Changes**: Language changes trigger full editor recreation

3. **Use `setValue()` for Programmatic Updates**: More efficient than changing `value` prop

## Testing Memory Leaks

### Manual Testing

1. Mount the editor component
2. Unmount the component
3. Take a heap snapshot in Chrome DevTools → Memory
4. Search for "monaco" in the snapshot
5. Verify no detached editor or model instances remain

### Automated Testing

```tsx
import { render, cleanup } from '@testing-library/react';
import { useMonacoEditor } from '@/hooks/useMonacoEditor';

test('disposes editor and model on unmount', () => {
  const { unmount } = render(<EditorComponent />);

  // Verify resources are registered
  expect(mockRegisterResource).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'monaco-editor' })
  );
  expect(mockRegisterResource).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'monaco-model' })
  );

  unmount();

  // Verify dispose functions are called
  expect(mockEditor.dispose).toHaveBeenCalled();
  expect(mockModel.dispose).toHaveBeenCalled();
});
```

## Common Issues

### Issue: Editor not visible

**Solution**: Ensure the container has explicit dimensions:
```tsx
<div ref={containerRef} style={{ width: '100%', height: '400px' }} />
```

### Issue: TypeScript errors on `editor` or `model`

**Solution**: Check for `null` before using:
```tsx
if (editor) {
  editor.getAction('editor.action.formatDocument').run();
}
```

### Issue: Editor doesn't update when `value` changes

**Solution**: This is handled automatically via `useEffect`. If it doesn't work, check:
- `isReady` is `true`
- `value` prop is actually changing (use React DevTools)

## Related

- [useComponentCleanup](./useComponentCleanup.md) - Resource tracking
- [useMemoryMonitor](./useMemoryMonitor.md) - Memory profiling
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html) - Official docs

## Credits

Based on Monaco Editor v0.52+ and @monaco-editor/react v4.7+.
