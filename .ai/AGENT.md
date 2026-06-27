# `.ai/` — Knowledge Base

Index/manifest cho tri thức persistent của project. **Đọc file này TRƯỚC khi bắt đầu một
tác vụ** để tái dùng tri thức cũ. Rule đầy đủ: xem `.claude/CLAUDE.md` → mục
*RULE: Knowledge Persistence*.

Cấu trúc:
- `map/` — bản đồ vùng code (cấu trúc, luồng dữ liệu, dependency)
- `features/` — tri thức theo module/feature
- `investigations/` — kết quả điều tra / debug / root-cause (`YYYY-MM-DD-<slug>.md`)
- `decisions/` — ADR rút gọn (`NNNN-<slug>.md`)
- `changes/` — nhật ký thay đổi đáng kể (`YYYY-MM-DD-<slug>.md`)

## Index
<!-- 1 dòng/file: - [title](path) — hook. Cập nhật mỗi khi thêm/đổi tên file. -->

### map/ — bản đồ codebase
<!-- (chưa có — thêm khi điều tra một vùng code) -->

### features/ — theo module
- [Study engagement — Pomodoro widget, Study Sessions, Leaderboard](features/study-engagement.md) — khi đụng Pomodoro/leaderboard/StudySession, widget nổi, mốc UTC
- [Trang học theo chủ đề + quiz hoàn thành](features/topic-learn-and-quiz.md) — route `goals/[id]/topics/[topicId]`, bài giảng, quiz gate hoàn thành

### investigations/ — điều tra / debug
<!-- (chưa có) -->

### decisions/ — quyết định kỹ thuật (ADR)
- [0001 — Chấm quiz hoàn thành ở client](decisions/0001-client-side-quiz-grading.md) — vì sao quiz topic ephemeral + chấm client, khi nào nên đổi
- [0002 — Pomodoro là widget nổi toàn cục](decisions/0002-pomodoro-widget-architecture.md) — vì sao state ở widget + event `pomodoro:open`, đã bỏ trang focus

### changes/ — nhật ký thay đổi
- [2026-06-27 — Đợt tăng tương tác học tập](changes/2026-06-27-learning-interactivity.md) — tóm tắt Nhóm A + M27/M28 + trang học/quiz, schema/migration, gotcha