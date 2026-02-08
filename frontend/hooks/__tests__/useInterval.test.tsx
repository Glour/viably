/**
 * useInterval Hook Tests
 *
 * Tests for automatic cleanup and pause/resume functionality.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useInterval } from '../useInterval';

describe('useInterval', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should execute callback on interval', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should pause interval when delay is null', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 as number | null } }
    );

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Pause
    rerender({ delay: null });
    jest.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called while paused

    // Resume
    rerender({ delay: 1000 });
    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should update callback without restarting interval', () => {
    let counter = 0;
    const callback1 = jest.fn(() => {
      counter += 1;
    });
    const callback2 = jest.fn(() => {
      counter += 10;
    });

    const { rerender } = renderHook(
      ({ cb }) => useInterval(cb, 1000),
      { initialProps: { cb: callback1 } }
    );

    jest.advanceTimersByTime(1000);
    expect(counter).toBe(1);

    // Change callback
    rerender({ cb: callback2 });

    jest.advanceTimersByTime(1000);
    expect(counter).toBe(11); // Now adds 10
  });

  it('should cleanup on unmount', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    jest.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1); // Not called after unmount
  });

  it('should restart interval when delay changes', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 } }
    );

    jest.advanceTimersByTime(500); // Halfway through first interval
    expect(callback).not.toHaveBeenCalled();

    // Change delay - should restart
    rerender({ delay: 2000 });

    jest.advanceTimersByTime(500); // Total 1000ms, but new interval is 2000ms
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1500); // Total 2500ms, first tick at 2000ms
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle negative delay gracefully', () => {
    const callback = jest.fn();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    renderHook(() => useInterval(callback, -1000));

    jest.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();

    if (process.env.NODE_ENV === 'development') {
      expect(warnSpy).toHaveBeenCalled();
    }

    warnSpy.mockRestore();
  });
});
