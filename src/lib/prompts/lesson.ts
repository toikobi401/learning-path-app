type LessonInput = {
  topicTitle: string;
  topicDescription: string;
  goalTitle: string;
  level: "beginner" | "intermediate" | "advanced";
};

// Sinh bài giảng ngắn dạng Markdown cho 1 topic (Module 15 — "Học ngay").
export function buildLessonPrompt(input: LessonInput): string {
  const { topicTitle, topicDescription, goalTitle, level } = input;

  const depth =
    level === "beginner"
      ? "Giải thích từ căn bản, giả định người học chưa biết gì. Tránh thuật ngữ chưa định nghĩa."
      : level === "intermediate"
        ? "Giả định người học đã quen kiến thức cơ bản; tập trung vào hiểu sâu và ứng dụng."
        : "Giả định nền tảng vững; tập trung pattern nâng cao, đánh đổi, và thực tiễn.";

  return `Bạn là một gia sư giỏi. Viết một BÀI GIẢNG NGẮN, dễ hiểu cho người học về chủ đề dưới đây, trong bối cảnh mục tiêu học tập của họ.

## Bối cảnh
- Mục tiêu tổng: ${goalTitle}
- Chủ đề: ${topicTitle}
- Mô tả: ${topicDescription}
- Trình độ người học: ${level}. ${depth}

## Yêu cầu nội dung (định dạng Markdown, KHÔNG bọc trong code block)
Trình bày theo các phần sau, dùng heading Markdown (##):
1. **Khái niệm cốt lõi** — giải thích chủ đề là gì và vì sao quan trọng (3-5 câu).
2. **Ý chính cần nắm** — danh sách 3-6 gạch đầu dòng các điểm then chốt.
3. **Ví dụ minh họa** — 1-2 ví dụ cụ thể (kèm code block nếu là chủ đề kỹ thuật).
4. **Lỗi thường gặp** — 2-3 cạm bẫy người học hay mắc.
5. **Bài tập nhỏ** — 1-2 bài tập/câu hỏi để tự luyện (kèm gợi ý ngắn, KHÔNG cho đáp án đầy đủ).

Viết súc tích, đúng trọng tâm, giọng văn thân thiện khích lệ. Độ dài vừa phải (~400-700 từ).`;
}
