type ReviewInput = {
  goalTitle: string;
  goalDescription: string;
  level: string;
  weekNumber: number;
  totalWeeks: number;
  completedThisWeek: Array<{ title: string; estimatedHrs: number }>;
  totalCompleted: number;
  totalTopics: number;
  phaseSummaries: Array<{ title: string; completed: number; total: number }>;
};

export function buildWeeklyReviewPrompt(input: ReviewInput): string {
  const {
    goalTitle,
    goalDescription,
    level,
    weekNumber,
    totalWeeks,
    completedThisWeek,
    totalCompleted,
    totalTopics,
    phaseSummaries,
  } = input;

  const overallPct =
    totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

  const phaseText = phaseSummaries
    .map((p) => `- ${p.title}: ${p.completed}/${p.total} topics done`)
    .join("\n");

  const recentText =
    completedThisWeek.length > 0
      ? completedThisWeek.map((t) => `- ${t.title} (${t.estimatedHrs}h)`).join("\n")
      : "No topics completed this week.";

  return `You are an expert learning coach. Analyze this learner's weekly progress and give actionable feedback.

## Learning Goal
Title: ${goalTitle}
Description: ${goalDescription}
Level: ${level}
Timeline: Week ${weekNumber} of ${totalWeeks}

## Overall Progress
${totalCompleted}/${totalTopics} topics completed (${overallPct}%)

## Progress by Phase
${phaseText}

## Completed This Week
${recentText}

## Instructions
Analyze the progress and return ONLY valid JSON with no markdown, no explanation — just the JSON object.

## Required JSON structure
{
  "summary": "<2-3 sentences summarizing this week's progress honestly and specifically>",
  "strengths": ["<specific achievement or positive pattern observed>"],
  "challenges": ["<specific area where progress is slow or topics are being skipped>"],
  "adjustments": ["<concrete, actionable suggestion for next week>"],
  "motivation": "<1 short encouraging sentence tailored to where they are in the journey>"
}

## Rules
- Be specific — reference actual topics and phases, not generic advice
- strengths: 1-3 items (skip section if nothing to praise yet)
- challenges: 1-3 items (be honest but not harsh)
- adjustments: 2-4 concrete next steps for the coming week
- If no topics were completed this week, still provide useful guidance based on the overall state
- Calibrate expectations for ${level} level learners`;
}
