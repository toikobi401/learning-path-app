---
title: Trang học theo chủ đề + hoàn thành bằng quiz (M15 nâng cấp)
date: 2026-06-27
tags: [topic, lesson, quiz, progress, learn-page]
---

## Bối cảnh / Vấn đề
M15 ban đầu hiển thị bài giảng inline ở trang mục tiêu. Đã chuyển sang **trang học riêng**
và **gate hoàn thành bằng bài trắc nghiệm AID** thay cho nút đánh dấu thủ công.

## Nội dung
- **Route:** `src/app/(dashboard)/dashboard/goals/[id]/topics/[topicId]/page.tsx` —
  **server component** tải **mọi thứ trong 1 truy vấn Prisma**: topic + `lesson` + `progress_logs`
  (lọc theo user) + `resources` + toàn bộ `phases.topics` (để tính prev/next). Kiểm tra sở hữu
  qua `topic.phase.path.goal.user_id === session.user.id` **và** `goal.id === [id]` URL → `notFound()`.
  Truyền xuống client `src/components/topic-learn-view.tsx`.
- Nút **"Học"** ở `goals/[id]/page.tsx` giờ là `<Link>` tới route trên (đã **gỡ** `LessonSection`
  inline + state `expandedLessons` + import `Markdown` khỏi trang mục tiêu).
- **Hoàn thành bằng quiz** (`src/components/topic-quiz.tsx`):
  - `POST /api/topics/[id]/quiz` sinh MCQ **bám sát nội dung bài giảng** (`buildTopicQuizPrompt`,
    cắt lesson 3500 ký tự; fallback dùng mô tả topic). **Không lưu DB** (ephemeral, giống practice quiz).
    Validate đúng 4 option + `correct_index` 0–3.
  - **Chấm phía client**; đúng **≥ 70%** → `PATCH /api/topics/[id]/progress {status:"completed"}` rồi
    callback `onPassed()` cập nhật UI. Vẫn giữ link **đánh dấu thủ công** + **làm lại** (`pomodoro:open`
    không liên quan ở đây).
- **GOTCHA:** payload quiz có `correct_index` (lộ đáp án trong network) — chấp nhận vì là bài
  tự kiểm tra. Xem [[0001-client-side-quiz-grading]] nếu cần nâng lên chấm server / lưu điểm.
- Bài giảng vẫn qua `aiComplete(userId, "generation", …)` (lớp AI đa-provider), không gọi SDK trực tiếp.

## Liên quan
- [[study-engagement]] — nút "mở đồng hồ tập trung" trên trang học
- [[0001-client-side-quiz-grading]] — quyết định chấm quiz ở client
