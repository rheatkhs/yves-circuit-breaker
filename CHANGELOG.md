# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-25

### Initial Release

The first official release of `yves-circuit-breaker`, a zero-dependency, framework-agnostic Circuit Breaker pattern implementation.

### Features

- **Core State Machine**: Support for `CLOSED`, `OPEN`, and `HALF_OPEN` states.
- **Fail-Fast Logic**: Rejects requests immediately with `CircuitOpenError` when in the `OPEN` state.
- **Auto-Recovery**: Automatically transitions to `HALF_OPEN` after a configurable `resetTimeoutMs`.
- **Easy Integration**: Includes a `wrap()` utility that automatically manages state based on promise resolution/rejection.
- **TypeScript First**: Strict types included for a premium developer experience.
- **Universal Support**: Runs in Node.js, browsers, Cloudflare Workers, and Bun.

### Technical Details

- **Zero External Dependencies**: Lightweight and secure.
- **Modern ESM**: Built with standard ES Modules for modern environments.
- **Types Generated**: Full `.d.ts` and source maps provided in the `dist/` bundle.
