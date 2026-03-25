import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker, CircuitOpenError, CircuitState } from '../src/index';

describe('CircuitBreaker', () => {
    const options = {
        failureThreshold: 3,
        resetTimeoutMs: 100,
    };

    let breaker: CircuitBreaker;

    beforeEach(() => {
        breaker = new CircuitBreaker(options);
        vi.useFakeTimers();
    });

    it('should start in CLOSED state', () => {
        expect(breaker.isOpen()).toBe(false);
    });

    it('should transition to OPEN after reaching failure threshold', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('failure'));
        const wrapped = breaker.wrap(fn);

        for (let i = 0; i < options.failureThreshold; i++) {
            try {
                await wrapped();
            } catch (e) { }
        }

        expect(breaker.isOpen()).toBe(true);
        await expect(wrapped()).rejects.toThrow(CircuitOpenError);
        expect(fn).toHaveBeenCalledTimes(options.failureThreshold);
    });

    it('should transition to HALF_OPEN after timeout', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('failure'));
        const wrapped = breaker.wrap(fn);

        for (let i = 0; i < options.failureThreshold; i++) {
            try {
                await wrapped();
            } catch (e) { }
        }

        expect(breaker.isOpen()).toBe(true);

        // Fast-forward time
        vi.advanceTimersByTime(options.resetTimeoutMs + 1);

        expect(breaker.isOpen()).toBe(false); // Transitions to HALF_OPEN
    });

    it('should transition back to CLOSED on success in HALF_OPEN', async () => {
        const failFn = vi.fn().mockRejectedValue(new Error('failure'));
        const successFn = vi.fn().mockResolvedValue('success');

        const failWrapped = breaker.wrap(failFn);

        for (let i = 0; i < options.failureThreshold; i++) {
            try {
                await failWrapped();
            } catch (e) { }
        }

        vi.advanceTimersByTime(options.resetTimeoutMs + 1);

        // Now in HALF_OPEN (via isOpen call in wrap)
        const successWrapped = breaker.wrap(successFn);
        const result = await successWrapped();

        expect(result).toBe('success');
        expect(breaker.isOpen()).toBe(false);

        // Ensure it's CLOSED by checking failureCount indirectly (needs another success to be sure or state check)
        // Actually recordSuccess sets it to CLOSED
    });

    it('should transition back to OPEN on failure in HALF_OPEN', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('failure'));
        const wrapped = breaker.wrap(fn);

        for (let i = 0; i < options.failureThreshold; i++) {
            try {
                await wrapped();
            } catch (e) { }
        }

        vi.advanceTimersByTime(options.resetTimeoutMs + 1);

        // Test request in HALF_OPEN fails
        try {
            await wrapped();
        } catch (e) { }

        expect(breaker.isOpen()).toBe(true);
    });

    it('should reset failure count on success', async () => {
        const failFn = vi.fn().mockRejectedValue(new Error('failure'));
        const successFn = vi.fn().mockResolvedValue('success');

        const failWrapped = breaker.wrap(failFn);
        const successWrapped = breaker.wrap(successFn);

        // 2 failures (threshold 3)
        await expect(failWrapped()).rejects.toThrow();
        await expect(failWrapped()).rejects.toThrow();

        await successWrapped();

        // Another failure should NOT trip it
        await expect(failWrapped()).rejects.toThrow();
        expect(breaker.isOpen()).toBe(false);
    });
});
