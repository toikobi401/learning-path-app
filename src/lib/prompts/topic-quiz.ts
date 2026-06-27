export type TopicQuizOptions = {
  topicTitle: string;
  topicDescription: string;
  lessonContent?: string | null;
  level: string;
  count: number;
};

// Prompt sinh câu hỏi trắc nghiệm (MCQ) kiểm tra hiểu biết về 1 chủ đề.
// Ưu tiên bám sát nội dung bài giảng nếu đã có.
export function buildTopicQuizPrompt(opts: TopicQuizOptions): string {
  const lesson = (opts.lessonContent ?? "").trim();
  const grounding = lesson
    ? `Lesson content the learner just studied (base your questions on this):
"""
${lesson.slice(0, 3500)}
"""`
    : `No lesson text available — base your questions on the topic title and description.`;

  return `You are an expert educator creating a short comprehension check.

Learner level: ${opts.level}
Topic: "${opts.topicTitle}"
Topic description: ${opts.topicDescription}

${grounding}

Generate exactly ${opts.count} multiple-choice questions (type "mcq") that verify the learner
actually understands this topic.

Rules:
- Each question has exactly 4 options.
- correct_index is 0-based (0=A, 1=B, 2=C, 3=D).
- Wrong options must be plausible but clearly wrong to someone who understood the material.
- Questions must test understanding/application, not trivial wording.
- Cover different aspects of the topic; do not repeat the same point.
- Keep each question and option concise.

Return ONLY valid JSON in this exact shape:
{
  "questions": [
    {
      "question": "...",
      "options": ["A text", "B text", "C text", "D text"],
      "correct_index": 0,
      "explanation": "Brief explanation of why the correct answer is right."
    }
  ]
}`;
}
