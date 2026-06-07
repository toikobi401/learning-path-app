# Prisma Schema — Learning Path App

## Enums

```prisma
enum Level       { beginner intermediate advanced }
enum GoalStatus  { active paused completed }
enum PathStatus  { draft active }
enum ResourceType  { article video course doc }
enum ResourceSource { ai_suggested user_added }
enum TopicStatus { not_started in_progress completed }
enum Mood        { great good okay hard }
enum MessageRole { user assistant }
```

## Core Models

### User (+ NextAuth models)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?           // null với OAuth users
  provider      String    @default("email")
  avatar_url    String?
  emailVerified DateTime?
  image         String?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  accounts       Account[]
  sessions       Session[]
  goals          Goal[]
  progress_logs  ProgressLog[]
  daily_checkins DailyCheckin[]
  chat_messages  ChatMessage[]
  weekly_reviews WeeklyReview[]
}
// Account, Session, VerificationToken — standard NextAuth models
```

### Goal → LearningPath → Phase → Topic → Resource
```prisma
model Goal {
  id            String     @id @default(cuid())
  user_id       String
  title         String
  description   String     @db.Text
  level         Level      @default(beginner)
  hours_per_day Float
  deadline      DateTime
  status        GoalStatus @default(active)
  // Relations: user, learning_path, daily_checkins, chat_messages, weekly_reviews
}

model LearningPath {
  id           String     @id @default(cuid())
  goal_id      String     @unique    // 1-1 với Goal
  raw_json     Json                  // Full response từ LLM
  total_weeks  Int
  status       PathStatus @default(draft)
  // Relations: goal, phases[]
}

model Phase {
  id          String @id @default(cuid())
  path_id     String
  title       String  // "Phase 1: Foundations"
  order_index Int
  // Relations: path, topics[]
}

model Topic {
  id            String @id @default(cuid())
  phase_id      String
  title         String
  description   String @db.Text
  estimated_hrs Float
  week_number   Int
  order_index   Int
  // Relations: phase, resources[], progress_logs[]
}

model Resource {
  id       String         @id @default(cuid())
  topic_id String
  title    String
  url      String         @db.Text
  type     ResourceType
  source   ResourceSource @default(ai_suggested)
}
```

### Progress & Activity
```prisma
model ProgressLog {
  user_id      String
  topic_id     String
  status       TopicStatus @default(not_started)
  completed_at DateTime?
  @@unique([user_id, topic_id])  // 1 log per user per topic
}

model DailyCheckin {
  user_id       String
  goal_id       String
  date          DateTime @db.Date
  hours_studied Float
  mood          Mood     @default(good)
  @@unique([user_id, goal_id, date])  // 1 checkin per day per goal
}

model ChatMessage {
  user_id    String
  goal_id    String
  role       MessageRole
  content    String @db.Text
  created_at DateTime @default(now())
}

model WeeklyReview {
  user_id     String
  goal_id     String
  week_number Int
  summary     String @db.Text
  adjustments Json   // Lộ trình điều chỉnh từ LLM
  @@unique([user_id, goal_id, week_number])
}
```
