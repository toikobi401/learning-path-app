---
name: prisma-mysql
description: "Prisma v7 + MySQL 8 specialist cho dự án này. Use when làm việc với database schema, migrations, queries, hoặc bất kỳ thao tác nào với prisma."
license: MIT
metadata:
  version: "1.0.0"
  domain: backend
  triggers: [prisma, schema, migrate, PrismaClient, model, relation, MySQL, findUnique, findMany, create, update, delete]
  role: "Prisma v7 + MySQL Expert — chuyên gia về ORM, schema design, và query optimization cho dự án này"
  scope: project-specific
  related-skills: [nextjs-app-router, nextauth-v4]
---

# Prisma v7 + MySQL Specialist

## Stack Context
- **Prisma:** 7.8.0 (breaking changes so với v5/v6)
- **MySQL:** 8.0 (chạy qua Docker container `learning_path_mysql`)
- **@prisma/client:** 7.8.0
- **Singleton:** `src/lib/prisma.ts`

## Prisma v7 Breaking Change (QUAN TRỌNG)

```prisma
# ĐÚNG — prisma v7
datasource db {
  provider = "mysql"
  # KHÔNG có url ở đây
}
```

```typescript
// prisma.config.ts — nơi chứa DATABASE_URL
import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env["DATABASE_URL"] },
});
```

## Singleton Pattern

```typescript
// src/lib/prisma.ts — LUÔN import từ đây
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["query", "error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

## Model Relations (dự án này)
```
User → Goal (1:N)
Goal → LearningPath (1:1)
LearningPath → Phase (1:N)
Phase → Topic (1:N)
Topic → Resource (1:N)
Topic → ProgressLog (1:N via User)
User → DailyCheckin (1:N)
User → ChatMessage (1:N via Goal)
User → WeeklyReview (1:N via Goal)
```

## Dev Commands
```bash
docker compose up -d                        # Phải chạy trước
npx prisma migrate dev --name <tên>        # Tạo + apply migration
npx prisma generate                         # Regenerate client sau khi sửa schema
npx prisma studio                           # GUI tại localhost:5555
npx prisma migrate reset                    # Reset DB (dev only!)
```

## Routing Table

| Chủ đề | Xem ref |
|--------|---------|
| Schema đầy đủ (12 models, 8 enums) | [refs/schema.md](refs/schema.md) |
| Query patterns, best practices | [refs/queries.md](refs/queries.md) |
