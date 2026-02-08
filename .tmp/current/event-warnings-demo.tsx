/**
 * Demo: Enhanced Event Listener Warnings (T038)
 *
 * This file demonstrates the enhanced dev mode warnings for uncleaned event listeners.
 * To test:
 * 1. Add this component to a page in the app
 * 2. Navigate to the page
 * 3. Navigate away (unmount the component)
 * 4. Check browser console for enhanced warnings
 */

'use client';

import { useEffect } from 'react';
import { useComponentCleanup } from '@/hooks/useComponentCleanup';

/**
 * Example 1: Window Resize Listener (CORRECT - with cleanup)
 */
export function CorrectResizeListener() {
  const { registerSubscription } = useComponentCleanup('CorrectResizeListener');

  useEffect(() => {
    const handleResize = () => {
      console.log('Window resized:', window.innerWidth);
    };

    // ✅ CORRECT: Register cleanup BEFORE adding listener
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleResize),
      metadata: { event: 'resize', target: 'window' },
    });

    window.addEventListener('resize', handleResize);
  }, [registerSubscription]);

  return <div>Correct: Resize the window (cleanup registered)</div>;
}

/**
 * Example 2: Window Scroll Listener (INCORRECT - missing cleanup)
 * This will trigger the enhanced warning when unmounted
 */
export function IncorrectScrollListener() {
  useEffect(() => {
    const handleScroll = () => {
      console.log('Window scrolled:', window.scrollY);
    };

    // ❌ INCORRECT: No cleanup registered
    window.addEventListener('scroll', handleScroll);

    // When component unmounts, you'll see:
    // ⚠️ Memory Leak Warning: Uncleaned Event Listener in IncorrectScrollListener
    //   eventType: "scroll"
    //   target: "window"
    //   💡 How to fix: [detailed recommendations]
  }, []);

  return <div>Incorrect: Scroll the page (no cleanup - will leak)</div>;
}

/**
 * Example 3: Document Keyboard Listener (CORRECT - with cleanup)
 */
export function CorrectKeyboardListener() {
  const { registerSubscription } = useComponentCleanup('CorrectKeyboardListener');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('Escape pressed');
      }
    };

    // ✅ CORRECT: Register cleanup BEFORE adding listener
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => document.removeEventListener('keydown', handleKeyDown),
      metadata: { event: 'keydown', target: 'document' },
    });

    document.addEventListener('keydown', handleKeyDown);
  }, [registerSubscription]);

  return <div>Correct: Press Escape (cleanup registered)</div>;
}

/**
 * Example 4: Document Click Listener (INCORRECT - missing cleanup)
 * This will trigger the enhanced warning when unmounted
 */
export function IncorrectClickListener() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      console.log('Document clicked:', e.target);
    };

    // ❌ INCORRECT: No cleanup registered
    document.addEventListener('click', handleClick);

    // When component unmounts, you'll see:
    // ⚠️ Memory Leak Warning: Uncleaned Event Listener in IncorrectClickListener
    //   eventType: "click"
    //   target: "document"
    //   💡 How to fix: [detailed recommendations]
  }, []);

  return <div>Incorrect: Click anywhere (no cleanup - will leak)</div>;
}

/**
 * Example 5: Multiple Event Listeners (MIXED - some correct, some incorrect)
 */
export function MixedEventListeners() {
  const { registerSubscription } = useComponentCleanup('MixedEventListeners');

  useEffect(() => {
    const handleResize = () => console.log('Resized');
    const handleScroll = () => console.log('Scrolled');
    const handleKeyDown = (e: KeyboardEvent) => console.log('Key:', e.key);

    // ✅ CORRECT: Resize listener with cleanup
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleResize),
      metadata: { event: 'resize', target: 'window' },
    });
    window.addEventListener('resize', handleResize);

    // ❌ INCORRECT: Scroll listener without cleanup
    window.addEventListener('scroll', handleScroll);

    // ❌ INCORRECT: Keyboard listener without cleanup
    document.addEventListener('keydown', handleKeyDown);

    // When component unmounts, you'll see 2 enhanced warnings:
    // 1. ⚠️ Memory Leak Warning: Uncleaned Event Listener (scroll)
    // 2. ⚠️ Memory Leak Warning: Uncleaned Event Listener (keydown)
  }, [registerSubscription]);

  return <div>Mixed: Some listeners cleaned, some leak</div>;
}

/**
 * Example 6: Element Event Listener (CORRECT - with element metadata)
 */
export function CorrectElementListener() {
  const { registerSubscription } = useComponentCleanup('CorrectElementListener');
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleClick = () => {
      console.log('Button clicked');
    };

    // ✅ CORRECT: Register cleanup with element metadata
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => button.removeEventListener('click', handleClick),
      metadata: {
        event: 'click',
        target: 'element',
        element: 'button#demo-button',
      },
    });

    button.addEventListener('click', handleClick);
  }, [registerSubscription]);

  return <button ref={buttonRef} id="demo-button">Click Me</button>;
}

/**
 * Demo Page Component
 * Add this to a page to test the warnings
 */
export default function EventWarningsDemo() {
  const [showCorrect, setShowCorrect] = React.useState(true);
  const [showIncorrect, setShowIncorrect] = React.useState(true);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Event Listener Warnings Demo (T038)</h1>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Correct Examples (No Warnings)</h2>

        <button
          onClick={() => setShowCorrect(!showCorrect)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {showCorrect ? 'Hide' : 'Show'} Correct Examples
        </button>

        {showCorrect && (
          <div className="space-y-2 p-4 border border-green-500 rounded">
            <CorrectResizeListener />
            <CorrectKeyboardListener />
            <CorrectElementListener />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Incorrect Examples (Will Show Warnings)</h2>

        <button
          onClick={() => setShowIncorrect(!showIncorrect)}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          {showIncorrect ? 'Hide' : 'Show'} Incorrect Examples
        </button>

        {showIncorrect && (
          <div className="space-y-2 p-4 border border-red-500 rounded">
            <IncorrectScrollListener />
            <IncorrectClickListener />
            <MixedEventListeners />
          </div>
        )}
      </div>

      <div className="p-4 bg-yellow-100 rounded">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open browser DevTools console</li>
          <li>Navigate to this page</li>
          <li>Toggle the incorrect examples (show/hide)</li>
          <li>Check console for enhanced warnings</li>
          <li>Warnings include event type, target, and fix recommendations</li>
        </ol>
      </div>
    </div>
  );
}

// Missing React import at the top - add this
import React from 'react';
