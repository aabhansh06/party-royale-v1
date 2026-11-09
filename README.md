# Party Royale v1.0

A real-time, private-room trivia party game for 2–8 players. This is the first runnable development build, based on the approved v1.0 design.

## Stack
- Client: React 18 + Vite
- Server: Node.js + Express + Socket.IO
- Database connection configuration: MongoDB/Mongoose (room runtime is currently in-memory; persistence is a later implementation task)
- Tests: Node.js built-in test runner (12 unit tests; Socket.IO integration tests included but require dependency installation)

## Requirements
- Node.js 20+
- npm 10+

## Run locally
1. Copy `.env.example` to `.env` in the project root.
2. Install dependencies: `npm install`
3. Start client and server: `npm run dev`
4. Open `http://localhost:5173` in two or more browser windows/devices.
5. Create a room in one window and join using its six-character code in the others.

Server health endpoint: `http://localhost:4000/health`.

## Tests
Run `npm test` from the project root for the 12 engine unit tests. After dependencies are installed, run `npm run test:integration -w server` for the Socket.IO integration tests (host creates room, guest joins, synchronized start, and non-host start rejection).

## Current implementation scope
- Private six-character room codes; host start; 2–8 player limit; duplicate nickname rejection.
- 5 rounds / 28 built-in questions; randomized order; synchronized question state.
- Server-side answer validation and scoring; fastest correct answer receives highest placement score.
- Two random power-ups per player; Double Trouble, Shield, Freeze Time, 50/50 and Point Steal.
- Live score updates, automatic host transfer on disconnect, and match-end rankings.

## Important MVP limitations (not yet production-ready)
- Rooms live in server memory. Restarting the server loses rooms; MongoDB persistence and multi-instance coordination are not implemented yet.
- Reconnection/session restoration is not yet implemented. A disconnected player is currently removed; host transfer is implemented.
- Current starter question bank is a small built-in set of 28 reviewed-for-demo prompts; content moderation, localization, larger randomized pools and image-based meme questions remain future work.
- 50/50 and Point Steal target selection are implemented in the current client UI.
- No production auth, rate limiting, anti-cheat hardening, deployment, analytics or load testing yet.

## Quality standard
Development changes must follow TDD and include unit and integration tests. Before launch, add Socket.IO integration tests, multi-client synchronization tests, reconnect/session tests, abuse/rate-limit tests and a deployment smoke test.

## Project structure
```text
party-royale-v1/
├── client/                 # React + Vite game UI
├── server/
│   ├── src/engine/         # Deterministic game rules and scoring
│   ├── src/sockets/        # Socket.IO room/game events
│   └── test/               # Engine unit tests
├── docs/                   # Product and technical notes
├── .env.example
└── README.md
```
