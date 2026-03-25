# yves-circuit-breaker

A zero-dependency, framework-agnostic, and pure-logic implementation of the Circuit Breaker pattern for TypeScript.

## Features

- ✅ Zero external dependencies
- ✅ Strict TypeScript support
- ✅ Works in Node.js, Browsers, Cloudflare Workers, and Bun
- ✅ State machine: CLOSED, OPEN, HALF_OPEN
- ✅ Simple `wrap` utility for async functions

## Installation

```bash
npm install yves-circuit-breaker
```

## Usage

```typescript
import { CircuitBreaker, CircuitOpenError } from 'yves-circuit-breaker';

const breaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 10000, // 10 seconds
});

const apiCall = async () => { /* ... */ };
const wrappedCall = breaker.wrap(apiCall);

try {
  const result = await wrappedCall();
} catch (error) {
  if (error instanceof CircuitOpenError) {
    console.error('Circuit is open, skipping request');
  } else {
    console.error('API call failed', error);
  }
}
```
