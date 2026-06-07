type PromptInput = {
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  hoursPerDay: number;
  deadlineDate: string;
  weeksAvailable: number;
};

export function buildLearningPathPrompt(input: PromptInput): string {
  const { title, description, level, hoursPerDay, deadlineDate, weeksAvailable } = input;
  const totalHours = Math.round(weeksAvailable * 7 * hoursPerDay);

  return `You are an expert curriculum designer. Create a detailed, personalized learning path.

## Goal
Title: ${title}
Description: ${description}
Current level: ${level}
Available time: ${hoursPerDay} hours/day
Deadline: ${deadlineDate} (${weeksAvailable} weeks from today)
Total study hours available: ~${totalHours} hours

## Instructions
Design a structured curriculum that fits this exact timeline. Return ONLY valid JSON with no markdown, no explanation — just the JSON object.

## Required JSON structure
{
  "total_weeks": <integer matching the weeks available>,
  "overview": "<2-3 sentence summary of what the learner will achieve and the approach taken>",
  "phases": [
    {
      "title": "<phase name, e.g. Foundations, Core Concepts, Projects>",
      "order_index": <0-based integer>,
      "topics": [
        {
          "title": "<concise topic name>",
          "description": "<2-3 sentences: what it is, what the learner will do, and why it matters>",
          "estimated_hrs": <realistic hours for this topic, 1-10>,
          "week_number": <1-based integer, which week this falls in>,
          "order_index": <0-based integer within this phase>
        }
      ]
    }
  ]
}

## Rules
- Create 2-4 phases that logically progress from fundamentals to application
- Each phase should have 3-8 topics
- Topics must be sequential and each should build on the previous
- Distribute topics across weeks so no single week is overloaded
- The sum of all estimated_hrs should be ≤ ${totalHours} (total hours available)
- week_number values must not exceed ${weeksAvailable}
- Topics within a phase should span consecutive weeks
- For a ${level} learner, calibrate depth appropriately — ${
    level === "beginner"
      ? "start from the very basics, assume no prior knowledge"
      : level === "intermediate"
        ? "assume basic familiarity, skip trivial intro material"
        : "assume solid foundational knowledge, focus on advanced patterns and real-world application"
  }`;
}
