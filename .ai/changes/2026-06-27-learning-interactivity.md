---
title: Đợt tăng tương tác học tập (Nhóm A + M27/M28 + trang học/quiz)
date: 2026-06-27
tags: [changelog, group-a, group-b, pomodoro, leaderboard, quiz]
---

## Bối cảnh / Vấn đề
Triển khai roadmap "tăng tính tương tác" (xem `PROGRESS.md`). Tóm tắt thay đổi lớn để tra cứu nhanh.

## Nội dung
- **Nhóm A (M15–M18):** bài giảng AI/topic (`TopicLesson`), ghi chú (`ProgressLog.note`),
  daily check-in (`DailyCheckin` + `/api/checkins`), hỏi AI tại topic (`?q=` ở chat).
- **M15 nâng cấp:** chuyển bài giảng sang **trang học riêng** + **hoàn thành bằng quiz** →
  xem [[topic-learn-and-quiz]], [[0001-client-side-quiz-grading]].
- **M27 Pomodoro + M28 Leaderboard:** `StudySession`, `/api/study-sessions`, `/api/leaderboard`,
  **widget nổi toàn cục** → xem [[study-engagement]], [[0002-pomodoro-widget-architecture]].
- **Schema mới:** `StudySession`, `TopicLesson`; thêm field Pomodoro + `leaderboard_opt_in` vào
  `UserSettings`. Migrations: `20260627000000_add_topic_lesson`, `20260628000000_add_study_sessions`.
  Local áp bằng `npx prisma db push` (lịch sử migration lệch — không dùng `migrate deploy` local).
- **Quy ước UI mới:** **không dùng emoji** trong giao diện (rule trong `.claude/CLAUDE.md`) — đã thay
  emoji nút Học/Ghi chú/mood, huy chương leaderboard bằng chữ/badge số.
- **Gotcha vận hành:** phải **tắt `next start` (node)** trước khi `prisma generate`/`npm run build`
  (lock `query_engine-windows.dll`, EPERM).

## Liên quan
- [[study-engagement]] · [[topic-learn-and-quiz]] · [[0001-client-side-quiz-grading]] · [[0002-pomodoro-widget-architecture]]
