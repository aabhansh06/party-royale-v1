# Party Royale v1.0 — Implementation Plan

## Phase 1 — Foundation and playable vertical slice (current)
- [x] React/Vite client and Express/Socket.IO server scaffold
- [x] Private room creation and joining
- [x] Server-authoritative question and scoring engine
- [x] Five round structure and 28-question bank
- [x] Power-up rule engine
- [x] Unit tests for core game rules
- [x] Socket.IO integration test scenarios authored (execution pending dependency installation)
- [ ] Persist rooms and match results in MongoDB

## Phase 2 — Rule completeness
- [x] Implement 50/50 option hiding in client
- [x] Add Point Steal target picker
- [ ] Verify round boundary and question-result UX
- [ ] Complete tie-break calculation and shared-victory UI
- [ ] Implement rematch in the same room

## Phase 3 — Reliability and security
- [ ] Session token and reconnect/rejoin flow
- [ ] Persist room/session state in MongoDB
- [ ] Add room expiry and stale-room cleanup
- [ ] Add rate limiting, payload validation and abuse controls
- [ ] Add multi-client synchronization and disconnect integration tests

## Phase 4 — Release
- [ ] Expand and review question bank
- [ ] Accessibility and responsive QA
- [ ] Load test 2–8 player rooms
- [ ] Configure production environment and deployment
- [ ] End-to-end smoke test and release checklist

## Definition of done for each change
Use TDD: write/adjust a failing test first, implement the smallest change, then run unit and integration tests. Do not merge a feature without recorded test results.
