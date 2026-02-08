/**
 * Test Suite: useComponentCleanup Event Listener Warnings (T038)
 *
 * Validates that enhanced dev mode warnings are emitted for uncleaned event listeners.
 * These warnings include:
 * - Event type (click, scroll, resize, etc.)
 * - Target element (window, document, element)
 * - Registration timestamp
 * - Fix recommendations with code examples
 *
 * @see T038: Add dev mode warnings for uncleaned event listeners
 */

import { renderHook } from '@testing-library/react';
import { useComponentCleanup } from '../useComponentCleanup';

// Mock console methods for testing
const mockConsole = {
  group: jest.fn(),
  groupEnd: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
};

describe('useComponentCleanup - Event Listener Warnings (T038)', () => {
  let originalNodeEnv: string | undefined;
  let originalConsole: typeof console;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalConsole = { ...console };
  });

  beforeEach(() => {
    // Set development mode
    process.env.NODE_ENV = 'development';

    // Mock console methods
    console.group = mockConsole.group;
    console.groupEnd = mockConsole.groupEnd;
    console.warn = mockConsole.warn;
    console.log = mockConsole.log;
    console.error = mockConsole.error;

    // Clear mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore environment
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    // Restore console
    Object.assign(console, originalConsole);
  });

  describe('Enhanced Event Listener Warnings', () => {
    it('should emit enhanced warning for uncleaned window event listener', () => {
      const { unmount } = renderHook(() => useComponentCleanup('TestComponent'));
      const { result } = renderHook(() => useComponentCleanup('TestComponent'));

      // Register event listener subscription
      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {
          /* cleanup */
        },
        metadata: {
          event: 'resize',
          target: 'window',
        },
      });

      // Unmount without cleaning up
      unmount();

      // Verify enhanced warning was emitted
      expect(mockConsole.group).toHaveBeenCalledWith(
        expect.stringContaining('Memory Leak Warning: Uncleaned Event Listener')
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Event listener was not cleaned up before unmount'
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        'Details:',
        expect.objectContaining({
          eventType: 'resize',
          target: 'window',
        })
      );
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should include event type in warning (click)', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('ClickComponent')
      );

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {
          event: 'click',
          target: 'document',
        },
      });

      unmount();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Details:',
        expect.objectContaining({
          eventType: 'click',
          target: 'document',
        })
      );
    });

    it('should include event type in warning (scroll)', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('ScrollComponent')
      );

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {
          event: 'scroll',
          target: 'window',
        },
      });

      unmount();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Details:',
        expect.objectContaining({
          eventType: 'scroll',
          target: 'window',
        })
      );
    });

    it('should include event type in warning (keydown)', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('KeyboardComponent')
      );

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {
          event: 'keydown',
          target: 'document',
        },
      });

      unmount();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Details:',
        expect.objectContaining({
          eventType: 'keydown',
          target: 'document',
        })
      );
    });

    it('should include element metadata when provided', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('ElementComponent')
      );

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {
          event: 'click',
          target: 'element',
          element: 'button#submit',
        },
      });

      unmount();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Details:',
        expect.objectContaining({
          eventType: 'click',
          target: 'element',
          element: 'button#submit',
        })
      );
    });

    it('should provide fix recommendations', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('TestComponent')
      );

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {
          event: 'resize',
          target: 'window',
        },
      });

      unmount();

      // Verify fix recommendations are provided
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('How to fix:'));
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('registerSubscription is called BEFORE addEventListener')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('same function reference')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Example:'));
    });

    it('should include code example in warning', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('TestComponent')
      );

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {
          event: 'resize',
          target: 'window',
        },
      });

      unmount();

      // Verify code example includes correct event type and target
      const codeExample = mockConsole.log.mock.calls.find((call) =>
        call[0]?.includes('const { registerSubscription }')
      );
      expect(codeExample).toBeDefined();
      expect(codeExample![0]).toContain('window.removeEventListener');
      expect(codeExample![0]).toContain("'resize'");
      expect(codeExample![0]).toContain('window.addEventListener');
    });

    it('should handle unknown event type gracefully', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('TestComponent')
      );

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {
          // No event type provided
          target: 'window',
        },
      });

      unmount();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Details:',
        expect.objectContaining({
          eventType: 'unknown',
        })
      );
    });

    it('should handle unknown target gracefully', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('TestComponent')
      );

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {
          event: 'click',
          // No target provided
        },
      });

      unmount();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Details:',
        expect.objectContaining({
          target: 'unknown',
        })
      );
    });

    it('should use standard warning for non-event subscriptions', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('TestComponent')
      );

      result.current.registerSubscription({
        type: 'timer',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {},
      });

      unmount();

      // Should NOT use console.group for non-event subscriptions
      expect(mockConsole.group).not.toHaveBeenCalled();

      // Should use standard warning format
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('unmounted with active subscription: timer'),
        expect.any(Object)
      );
    });
  });

  describe('Production Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      jest.clearAllMocks();
    });

    it('should NOT emit warnings in production mode', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('TestComponent')
      );

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: {
          event: 'resize',
          target: 'window',
        },
      });

      unmount();

      // No warnings should be emitted in production
      expect(mockConsole.group).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.groupEnd).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Event Listeners', () => {
    it('should emit separate warnings for each uncleaned event listener', () => {
      const { result, unmount } = renderHook(() =>
        useComponentCleanup('MultiEventComponent')
      );

      // Register multiple event listeners
      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: { event: 'resize', target: 'window' },
      });

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: { event: 'scroll', target: 'window' },
      });

      result.current.registerSubscription({
        type: 'event',
        createdAt: Date.now(),
        cleanupFn: () => {},
        metadata: { event: 'keydown', target: 'document' },
      });

      unmount();

      // Verify warnings for all three listeners
      expect(mockConsole.group).toHaveBeenCalledTimes(3);
      expect(mockConsole.warn).toHaveBeenCalledTimes(3);
      expect(mockConsole.groupEnd).toHaveBeenCalledTimes(3);
    });
  });
});
