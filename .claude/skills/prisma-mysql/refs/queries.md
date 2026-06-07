# Prisma Query Patterns

## Basic Patterns

```typescript
import { prisma } from "@/lib/prisma";

// Tìm user theo email
const user = await prisma.user.findUnique({ where: { email } });

// Tìm với relations
const goal = await prisma.goal.findUnique({
  where: { id: goalId },
  include: {
    learning_path: {
      include: { phases: { include: { topics: { include: { resources: true } } } } }
    }
  }
});

// Create user (KHÔNG return password)
const user = await prisma.user.create({
  data: { name, email, password: hashedPassword, provider: "email" },
  select: { id: true, name: true, email: true },
});

// Update status
await prisma.goal.update({
  where: { id: goalId },
  data: { status: "completed" },
});

// Upsert progress log
await prisma.progressLog.upsert({
  where: { user_id_topic_id: { user_id, topic_id } },
  create: { user_id, topic_id, status: "completed", completed_at: new Date() },
  update: { status: "completed", completed_at: new Date() },
});
```

## Nested Create (Learning Path + Phases + Topics)

```typescript
await prisma.learningPath.create({
  data: {
    goal_id: goalId,
    raw_json: llmResponse,
    total_weeks: totalWeeks,
    status: "active",
    phases: {
      create: phases.map((phase, i) => ({
        title: phase.title,
        order_index: i,
        topics: {
          create: phase.topics.map((topic, j) => ({
            title: topic.title,
            description: topic.description,
            estimated_hrs: topic.estimated_hrs,
            week_number: topic.week_number,
            order_index: j,
            resources: {
              create: topic.resources.map(r => ({
                title: r.title,
                url: r.url,
                type: r.type,
                source: "ai_suggested",
              })),
            },
          })),
        },
      })),
    },
  },
});
```

## Aggregate / Stats

```typescript
// Đếm topics hoàn thành
const completedCount = await prisma.progressLog.count({
  where: { user_id, status: "completed" },
});

// Tổng giờ học trong tuần
const weekCheckins = await prisma.dailyCheckin.aggregate({
  where: { user_id, goal_id, date: { gte: weekStart, lte: weekEnd } },
  _sum: { hours_studied: true },
});
const totalHours = weekCheckins._sum.hours_studied ?? 0;

// Streak — số ngày liên tiếp
const checkins = await prisma.dailyCheckin.findMany({
  where: { user_id, goal_id },
  orderBy: { date: "desc" },
  take: 30,
  select: { date: true },
});
```

## Transaction

```typescript
// Dùng khi cần nhiều operations phải thành công cùng nhau
const [user, account] = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.account.create({ data: accountData }),
]);
```

## Pagination

```typescript
const goals = await prisma.goal.findMany({
  where: { user_id },
  orderBy: { created_at: "desc" },
  take: 10,    // limit
  skip: 0,     // offset
});
```
