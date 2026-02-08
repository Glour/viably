/**
 * useTimeout Hook Tests
 *
 * Tests for automatic cleanup and manual clear functionality.
 */

import { renderHook } from '@testing-library/react';
import { useTimeout } from '../useTimeout';

describe('useTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should execute callback after delay', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(999);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    // Should not execute again
    jest.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should allow manual clear before execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useTimeout(callback, 1000));

    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    // Clear timeout
    result.current.clear();

    jest.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle clear after execution gracefully', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useTimeout(callback, 1000));

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Clear after execution (should be safe)
    expect(() => result.current.clear()).not.toThrow();
  });

  it('should cleanup on unmount', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    unmount();

    jest.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should restart timeout when delay changes', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ delay }) => useTimeout(callback, delay),
      { initialProps: { delay: 1000 } }
    );

    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    // Change delay - should restart
    rerender({ delay: 2000 });

    jest.advanceTimersByTime(500); // Total 1000ms from start
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1500); // Total 2500ms, should execute at 2000ms from restart
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should update callback without restarting timeout', () => {
    let counter = 0;
    const callback1 = jest.fn(() => {
      counter = 1;
    });
    const callback2 = jest.fn(() => {
      counter = 10;
    });

    const { rerender } = renderHook(
      ({ cb }) => useTimeout(cb, 1000),
      { initialProps: { cb: callback1 } }
    );

    // Change callback before execution
    jest.advanceTimersByTime(500);
    rerender({ cb: callback2 });

    jest.advanceTimersByTime(500);
    expect(counter).toBe(10); // Should use latest callback
  });

  it('should handle negative delay gracefully', () => {
    const callback = jest.fn();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    renderHook(() => useTimeout(callback, -1000));

    jest.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();

    if (process.env.NODE_ENV === 'development') {
      expect(warnSpy).toHaveBeenCalled();
    }

    warnSpy.mockRestore();
  });

  it('should handle zero delay', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, 0));

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(0);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
