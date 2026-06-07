# Skill: Generate Learning Path

## Trigger
Khi user yêu cầu tạo hoặc chỉnh sửa logic sinh lộ trình học tập bằng AI.

## Context
- API route: `src/app/api/paths/generate/route.ts`
- Prompt template: `src/lib/prompts/generate-path.ts`
- Model: `claude-sonnet-4-6`
- Output: JSON có cấu trúc (phases → topics → resources)

## Expected JSON Output Schema
```typescript
{
  total_weeks: number,
  phases: [{
    title: string,
    order_index: number,
    topics: [{
      title: string,
      description: string,
      estimated_hrs: number,
      week_number: number,
      order_index: number,
      resources: [{
        title: string,
        url: string,
        type: "article" | "video" | "course" | "doc"
      }]
    }]
  }]
}
```

## Steps khi implement
1. Validate input (goal description, level, hours_per_day, deadline)
2. Tính total_weeks từ deadline
3. Build prompt từ template trong `src/lib/prompts/generate-path.ts`
4. Gọi Claude API với JSON mode
5. Parse và validate response
6. Lưu vào DB: LearningPath → Phase → Topic → Resource
7. Return path ID cho client
