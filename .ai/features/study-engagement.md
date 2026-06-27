---
title: Study engagement — Pomodoro widget, Study Sessions, Leaderboard (M27/M28)
date: 2026-06-27
tags: [pomodoro, leaderboard, study-session, settings, widget]
---

## Bối cảnh / Vấn đề
Nhóm B bổ sung tính năng giữ chân kiểu studiestimer.com: đồng hồ Pomodoro + bảng xếp
hạng thời gian học. Ghi lại luồng dữ liệu và các quyết định không hiển nhiên từ code.

## Nội dung
- **Nguồn dữ liệu duy nhất:** model `StudySession {user_id, goal_id?, minutes, source}`
  (`prisma/schema.prisma`). Cả **thống kê cá nhân** lẫn **leaderboard** đều tính từ bảng này.
  Chỉ **phiên focus hoàn thành** mới được log (`POST /api/study-sessions`, `minutes` 1–600,
  `source` = `pomodoro|manual`). Không lưu phiên nghỉ.
- **Widget nổi toàn cục:** `src/components/pomodoro-widget.tsx` được mount 1 lần trong
  `src/app/(dashboard)/layout.tsx` (cạnh `ChatWidget`). **Toàn bộ trạng thái đồng hồ
  (mode/secondsLeft/running/rounds) nằm trong widget** → vẫn đếm ngược khi thu nhỏ và khi
  đổi trang. Vị trí `fixed top-20 right-6 z-30` (dưới navbar sticky `z-40`).
- **Mở widget từ xa:** widget lắng nghe `window` event **`pomodoro:open`**. Các nút
  "mở đồng hồ" ở trang học (`topic-learn-view.tsx`) và leaderboard `dispatchEvent(new Event("pomodoro:open"))`
  thay vì điều hướng. (Đã **bỏ trang `/dashboard/focus`** và component `PomodoroTimer` cũ.)
- **Cấu hình Pomodoro** (`pomodoro_focus_min/break_min/long_break_min/rounds`) và
  **`leaderboard_opt_in`** lưu ở `UserSettings`, đọc/ghi qua `GET/PATCH /api/settings`
  (PATCH kẹp giá trị hợp lệ). Widget auto-save khi đổi.
- **Leaderboard** (`/api/leaderboard?range=today|week|all`): `prisma.studySession.groupBy`
  theo `_sum.minutes`, sắp giảm dần. Loại user `leaderboard_opt_in=false` **trừ chính mình**
  (để vẫn tính hạng). Hạng = vị trí trong danh sách đầy đủ; chỉ trả top 50 + `me`.
- **GOTCHA — mốc thời gian theo UTC:** helper `rangeStart()` (lặp ở cả 2 route
  `study-sessions` và `leaderboard`) dùng **nửa đêm UTC**; `week` = 7 ngày gần nhất.
  "Hôm nay" có thể lệch ngày so với giờ địa phương của user.

## Liên quan
- [[topic-learn-and-quiz]] — phiên focus thường mở từ trang học
- [[0002-pomodoro-widget-architecture]] — vì sao state ở widget + event mở
