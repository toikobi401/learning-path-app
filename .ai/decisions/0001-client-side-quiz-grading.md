---
title: Chấm quiz hoàn thành chủ đề ở phía client (ephemeral)
date: 2026-06-27
tags: [quiz, decision, topic, ai]
---

## Bối cảnh / Vấn đề
Trang học gate hoàn thành chủ đề bằng MCQ. Cần chọn cách sinh + chấm: lưu DB hay không,
chấm client hay server.

## Nội dung
**Quyết định:** sinh câu hỏi **ephemeral** (không lưu DB), trả về client **kèm `correct_index`
+ `explanation`**, **chấm phía client**; đạt ≥70% thì client gọi `PATCH progress completed`.

**Lý do:**
- Đây là **bài tự kiểm tra hình thành (formative)**, người học tự đánh giá — động cơ gian lận thấp.
- Nhất quán với luồng **practice quiz** sẵn có (`/api/phases/[id]/practice` cũng trả `correct_index`
  cho client). Tránh thêm bảng/État phức tạp.
- Nhanh, ít round-trip; không cần bảng lưu câu hỏi tạm.

**Phương án bị loại:**
- *Chấm server-side:* phải lưu câu hỏi+đáp án tạm (thêm bảng hoặc token ký) → phức tạp, chưa cần.
- *Lưu lịch sử điểm theo chủ đề:* hoãn; hiện chỉ cần cập nhật `ProgressLog.status`.

**Khi nào nên đổi:** nếu cần chống xem trộm đáp án (đánh giá có điểm thật) hoặc thống kê điểm quiz
theo thời gian → chuyển sang sinh→lưu→chấm server (có thể tái dùng pattern `PhaseQuizAttempt`).

## Liên quan
- [[topic-learn-and-quiz]] — nơi áp dụng
