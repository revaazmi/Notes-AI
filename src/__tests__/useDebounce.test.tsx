import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/lib/useDebounce";
import { describe, it, expect, vi } from "vitest";

describe("useDebounce", () => {
  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("updates value after delay", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 300 } }
    );

    expect(result.current).toBe("a");

    rerender({ value: "b", delay: 300 });
    expect(result.current).toBe("a");

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe("b");

    vi.useRealTimers();
  });

  it("does not update if delay hasn't elapsed", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "x", delay: 500 } }
    );

    rerender({ value: "y", delay: 500 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe("x");

    vi.useRealTimers();
  });
});
