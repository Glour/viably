/**
 * Timer Hooks Examples
 *
 * Demonstrates useInterval and useTimeout in real-world scenarios.
 */

"use client";

import { useState } from 'react';
import { useInterval } from './useInterval';
import { useTimeout } from './useTimeout';

// ============================================================================
// Example 1: Countdown Timer with Auto-Pause
// ============================================================================

export function CountdownTimer() {
  const [count, setCount] = useState(10);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cleanup interval when count reaches 0 or paused
  useInterval(
    () => {
      setCount((c) => {
        if (c <= 1) {
          return 0; // Stop at 0
        }
        return c - 1;
      });
    },
    count > 0 && !isPaused ? 1000 : null // null = paused
  );

  return (
    <div>
      <h2>Countdown: {count}s</h2>
      <button
        onClick={() => setIsPaused((p) => !p)}
        disabled={count === 0}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button onClick={() => setCount(10)}>Reset</button>
    </div>
  );
}

// ============================================================================
// Example 2: Auto-Save with Debounced Interval
// ============================================================================

export function AutoSaveEditor() {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save every 30 seconds if content changed
  useInterval(
    () => {
      console.log('Auto-saving...', content);
      setLastSaved(new Date());
      setIsDirty(false);
    },
    isDirty ? 30000 : null // Only save when dirty
  );

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setIsDirty(true);
        }}
        placeholder="Start typing... (auto-saves every 30s)"
        rows={5}
        cols={50}
      />
      {lastSaved && (
        <p>Last saved: {lastSaved.toLocaleTimeString()}</p>
      )}
      {isDirty && <p>Unsaved changes</p>}
    </div>
  );
}

// ============================================================================
// Example 3: Toast Notification with Auto-Dismiss
// ============================================================================

export function ToastNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  // Auto-dismiss after 3 seconds
  const { clear: cancelDismiss } = useTimeout(
    () => {
      setIsVisible(false);
    },
    isVisible ? 3000 : Number.MAX_SAFE_INTEGER // Only start timer when visible
  );

  const showToast = (msg: string) => {
    setMessage(msg);
    setIsVisible(true);
  };

  const dismissNow = () => {
    setIsVisible(false);
    cancelDismiss(); // Clear the auto-dismiss timer
  };

  return (
    <div>
      <button onClick={() => showToast('Success! This will auto-dismiss.')}>
        Show Toast
      </button>

      {isVisible && (
        <div style={{ padding: '1rem', background: '#4caf50', color: 'white' }}>
          {message}
          <button onClick={dismissNow} style={{ marginLeft: '1rem' }}>
            Dismiss Now
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Real-Time Clock
// ============================================================================

export function RealtimeClock() {
  const [time, setTime] = useState(new Date());

  // Update every second
  useInterval(() => {
    setTime(new Date());
  }, 1000);

  return (
    <div>
      <h2>{time.toLocaleTimeString()}</h2>
      <p>{time.toLocaleDateString()}</p>
    </div>
  );
}

// ============================================================================
// Example 5: Delayed Search (useTimeout instead of useDebounce)
// ============================================================================

export function DelayedSearch() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Clear previous timeout and start new one on each keystroke
  const { clear } = useTimeout(
    () => {
      if (query.trim()) {
        setIsSearching(true);
        // Simulate API call
        setTimeout(() => {
          setSearchResults([
            `Result 1 for "${query}"`,
            `Result 2 for "${query}"`,
            `Result 3 for "${query}"`,
          ]);
          setIsSearching(false);
        }, 500);
      } else {
        setSearchResults([]);
      }
    },
    500 // Search 500ms after user stops typing
  );

  const handleChange = (value: string) => {
    setQuery(value);
    clear(); // Cancel previous timeout
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search... (500ms delay)"
      />
      {isSearching && <p>Searching...</p>}
      <ul>
        {searchResults.map((result, idx) => (
          <li key={idx}>{result}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Example 6: Polling with Dynamic Interval
// ============================================================================

export function DynamicPolling() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [data, setData] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  useInterval(
    () => {
      console.log('Polling API...');
      // Simulate API call
      setStatus('loading');
      setTimeout(() => {
        setData(`Data at ${new Date().toLocaleTimeString()}`);
        setStatus('idle');
      }, 500);
    },
    pollInterval // Can be changed dynamically
  );

  return (
    <div>
      <h3>Dynamic Polling</h3>
      <div>
        <button onClick={() => setPollInterval(1000)}>Poll Every 1s</button>
        <button onClick={() => setPollInterval(5000)}>Poll Every 5s</button>
        <button onClick={() => setPollInterval(null)}>Stop Polling</button>
      </div>
      <p>Status: {status}</p>
      <p>Data: {data || 'No data yet'}</p>
    </div>
  );
}

// ============================================================================
// Combined Example: All Components
// ============================================================================

export function TimerHooksShowcase() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Timer Hooks Examples</h1>

      <section style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <h2>1. Countdown Timer</h2>
        <CountdownTimer />
      </section>

      <section style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <h2>2. Auto-Save Editor</h2>
        <AutoSaveEditor />
      </section>

      <section style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <h2>3. Toast Notification</h2>
        <ToastNotification />
      </section>

      <section style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <h2>4. Real-Time Clock</h2>
        <RealtimeClock />
      </section>

      <section style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <h2>5. Delayed Search</h2>
        <DelayedSearch />
      </section>

      <section style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <h2>6. Dynamic Polling</h2>
        <DynamicPolling />
      </section>
    </div>
  );
}
