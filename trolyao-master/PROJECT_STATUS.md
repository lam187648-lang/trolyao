# Implementation and verification status

Status labels: **Đã triển khai**, **Đã kiểm thử**, **Chưa kiểm thử thực tế**, **Cần cấu hình từ quản trị viên**, **Chưa hoàn thành**.

## Work status

| Area | Status | Notes |
|---|---|---|
| FUTURISTIC C chat interface | Đã triển khai; Đã kiểm thử giao diện | Browser smoke checks previously covered the welcome suggestions, chat reset, Markdown/code block actions, and tested viewport overflow. |
| Browser data backup/restore | Đã triển khai; Chưa kiểm thử với dữ liệu thật | Export is local-only; restore adds missing keys and attempts rollback if a storage write fails. No user data was exported during this work. |
| AI backend request handling | Đã triển khai; Chưa kiểm thử thực tế | Both server entrypoints validate basic payload shape, constrain the model to server configuration, use a 45-second upstream timeout, and return sanitized upstream errors. No live OpenRouter call was made. |
| Server/admin access | Đã triển khai; Cần cấu hình từ quản trị viên; Chưa kiểm thử thực tế | Admin kick and Pusher administrative operations now require `ADMIN_API_TOKEN`; Pusher admin channel is private. Set the token in Render and use it only when prompted. |
| Camera and head tracking | Đã triển khai; Chưa kiểm thử thực tế | The game uses one local video stream and releases it on stop/exit/page close. Real camera permission and tracking behavior still need a device check. |
| Garden presentation and replay state | Đã triển khai; Chưa kiểm thử thực tế | Styling and completion-stage/timer handling were updated. Token rewards and progress remain browser-side and are not tamper-resistant. |
| PostgreSQL schema, migrations, APIs | Chưa hoàn thành | No database client, schema, migration, rollback, account API, or `DATABASE_URL` integration exists. |
| Central account/profile/theme/game synchronization | Chưa hoàn thành | Existing browser storage remains the source for some data; multi-device conflict handling is not implemented. |
| Central wallet and transaction ledger | Chưa hoàn thành | Games can still modify local token values. Do not treat browser token balances as secure or authoritative. |
| Automated backend/database tests | Chưa hoàn thành | No test suite was added. This environment has no Node/npm/Git command available, so changed JavaScript could not be run through Node syntax checks or tests. |

## Game and interactive feature inventory

| Feature | Files | Work in this change | Verification |
|---|---|---|---|
| Head Tracking game | `head-tracking-game.html`, `head-tracking-game.js`, `head-tracking-game.css` | Single camera stream, visible camera/tracking states, release/exit handling, deep-space styling. | Manual hardware test required. |
| Khu vườn kiên nhẫn | `trongcay.html`, `garden-theme.css` | Dark premium styling, growth-stage effects, completion stage and timer reset/replay handling. | UI/gameplay/reload and token flow not tested end-to-end. |
| Study room (collaboration feature, not a standalone mini-game) | `study-room.html` and `study-room*.js` | No redesign or synchronization migration in this stage. | Not tested in this stage. |

## Manual camera checklist

1. Open `head-tracking-game.html`; confirm the camera does **not** start automatically.
2. Start the game and deny permission. Confirm a permission/error state appears and no game loop proceeds.
3. Retry with permission granted. Confirm the local video preview visibly shows the player and no camera media is uploaded.
4. With a face in view, confirm tracking/game response; move out of frame and confirm the no-face state appears. Return and confirm tracking resumes.
5. Stop, exit, and close/reload the page. Confirm the camera indicator turns off each time.
6. Start and stop more than once; confirm there is only one camera stream and no stale preview.
7. Repeat on supported mobile and desktop browsers, including a device without a camera.

## Issues addressed in code

- Removed code that deleted `userSchedule` during initialization.
- Added a browser-only backup/restore utility that does not overwrite existing keys.
- Added AI request payload checks, a server timeout, safer error responses, and server-side model selection.
- Kept a failed chat draft and attachments available for retry.
- Removed server-side hardcoded Pusher credentials; Pusher credentials are now environment-only.
- Added an admin token check to privileged kick/gift and private Pusher admin operations.
- Limited the root server's static-file fallback to files inside its own directory and prevented `/api/*` misses from returning the app shell.
- Reworked head-tracking camera startup to use one local stream and added cleanup paths.
- Corrected garden completion display and timer state for replay.

## Administrator actions still required

- Configure Render using [SERVER_SETUP.md](./SERVER_SETUP.md); add `OPENROUTER_API_KEY` and a strong `ADMIN_API_TOKEN`.
- If Pusher is used, configure its four environment variables. Rotate `PUSHER_SECRET` if it was ever exposed or committed previously.
- Run the manual camera checklist above.
- Download and securely store browser backups before any origin change or future migration.
- Do not configure production PostgreSQL until a tested schema, migration, rollback, and backend integration are delivered.

