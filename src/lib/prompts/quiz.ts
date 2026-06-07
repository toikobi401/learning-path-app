export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuestionType = "mcq" | "essay";

export type QuizGenOptions = {
  phaseTitle: string;
  goalTitle: string;
  level: string;
  topicSummaries: string[];
  difficulty: QuizDifficulty;
  count: number;
  types: QuestionType[];
};

const DIFFICULTY_GUIDE: Record<QuizDifficulty, string> = {
  easy: "basic recall and recognition; avoid ambiguity; one clearly correct answer",
  medium: "application and understanding; some nuance between options; explanation required",
  hard: "analysis, synthesis, and edge cases; plausible distractors; essay requires depth",
};

export function buildQuizPrompt(opts: QuizGenOptions): string {
  const hasMcq = opts.types.includes("mcq");
  const hasEssay = opts.types.includes("essay");
  const mcqCount = hasMcq && hasEssay ? Math.ceil(opts.count * 0.6) : hasMcq ? opts.count : 0;
  const essayCount = hasMcq && hasEssay ? opts.count - mcqCount : hasEssay ? opts.count : 0;

  const topicList = opts.topicSummaries.map((t, i) => `${i + 1}. ${t}`).join("\n");

  return `You are an expert educator creating a quiz for a learner.

Learning goal: "${opts.goalTitle}"
Phase: "${opts.phaseTitle}"
Learner level: ${opts.level}
Difficulty: ${opts.difficulty} — ${DIFFICULTY_GUIDE[opts.difficulty]}

Topics covered in this phase:
${topicList}

Generate exactly ${opts.count} questions:
${mcqCount > 0 ? `- ${mcqCount} multiple-choice questions (type: "mcq")` : ""}
${essayCount > 0 ? `- ${essayCount} open-ended essay questions (type: "essay")` : ""}

Rules:
- Questions must directly test knowledge from the listed topics
- MCQ: exactly 4 options; correct_index is 0-based (0=A, 1=B, 2=C, 3=D)
- MCQ: wrong options must be plausible but clearly wrong to a knowledgeable learner
- Essay: include a model_answer (3–5 sentences) that a good answer should cover, and grading_criteria listing 3 key points
- Order: mcq questions first, then essay questions
- Match difficulty level strictly

Return ONLY valid JSON in this exact shape:
{
  "questions": [
    {
      "type": "mcq",
      "question": "...",
      "options": ["A text", "B text", "C text", "D text"],
      "correct_index": 0,
      "explanation": "Brief explanation of why the answer is correct."
    },
    {
      "type": "essay",
      "question": "...",
      "model_answer": "A comprehensive answer covering...",
      "grading_criteria": ["criterion 1", "criterion 2", "criterion 3"]
    }
  ]
}`;
}
