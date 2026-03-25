export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export class CircuitOpenError extends Error {
    constructor(message: string = 'Circuit is currently OPEN') {
        super(message);
        this.name = 'CircuitOpenError';
    }
}

export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeoutMs: number;
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private lastFailureTime: number | null = null;
    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;

    constructor(options: CircuitBreakerOptions) {
        this.failureThreshold = options.failureThreshold;
        this.resetTimeoutMs = options.resetTimeoutMs;
    }

    isOpen(): boolean {
        if (this.state === CircuitState.OPEN) {
            const now = Date.now();
            if (this.lastFailureTime && now - this.lastFailureTime >= this.resetTimeoutMs) {
                this.state = CircuitState.HALF_OPEN;
                return false;
            }
            return true;
        }
        return false;
    }

    recordSuccess(): void {
        this.failureCount = 0;
        this.state = CircuitState.CLOSED;
        this.lastFailureTime = null;
    }

    recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
        }
    }

    getState(): CircuitState {
        // Ensure state is updated if timeout passed
        this.isOpen();
        return this.state;
    }

    wrap<T, Args extends any[]>(
        fn: (...args: Args) => Promise<T>
    ): (...args: Args) => Promise<T> {
        return async (...args: Args): Promise<T> => {
            if (this.isOpen()) {
                throw new CircuitOpenError();
            }

            try {
                const result = await fn(...args);
                this.recordSuccess();
                return result;
            } catch (error) {
                this.recordFailure();
                throw error;
            }
        };
    }
}
