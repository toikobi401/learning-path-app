# Skill: Database Migration

## Trigger
Khi thêm model mới, thay đổi schema, hoặc cần reset database.

## Commands

```bash
# Tạo migration mới sau khi sửa schema.prisma
npx prisma migrate dev --name <tên_thay_đổi>

# Xem trạng thái migrations
npx prisma migrate status

# Reset toàn bộ DB (dev only!)
npx prisma migrate reset

# Regenerate Prisma client (sau khi sửa schema mà không migrate)
npx prisma generate

# Mở GUI xem dữ liệu
npx prisma studio
```

## Lưu ý
- Luôn chạy `npx prisma generate` sau khi sửa schema
- MySQL phải đang chạy (`docker compose up -d`) trước khi migrate
- File `.env` phải có `DATABASE_URL` đúng
- Không commit file `.env` lên git
