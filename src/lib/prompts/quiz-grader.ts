export type EssayGradeInput = {
  question: string;
  model_answer: string;
  grading_criteria: string[];
  student_answer: string;
};

export function buildEssayGraderPrompt(essays: EssayGradeInput[]): string {
  const items = essays.map((e, i) => `
Question ${i + 1}: ${e.question}
Model answer: ${e.model_answer}
Grading criteria: ${e.grading_criteria.join("; ")}
Student answer: ${e.student_answer || "(no answer provided)"}
`).join("\n---\n");

  return `You are an expert grader for open-ended learning questions. Grade each essay answer fairly.

Scoring per question: 0–10 points
- 9–10: Comprehensive, accurate, shows deep understanding
- 7–8: Mostly correct, covers main criteria with minor gaps
- 5–6: Partial understanding, misses 1–2 key criteria
- 3–4: Some relevant points but significant gaps
- 1–2: Minimal understanding, mostly incorrect
- 0: No answer or completely off-topic

${items}

Return ONLY valid JSON:
{
  "grades": [
    {
      "score": 8,
      "feedback": "Concise 1–2 sentence feedback explaining the score and what was missing or well done."
    }
  ]
}

grades array must have exactly ${essays.length} entries, in the same order as the questions.`;
}
