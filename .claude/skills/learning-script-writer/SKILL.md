---
name: learning-script-writer
description: Viết kịch bản (script) video YouTube cho kênh hướng dẫn học tập / giáo dục. Use khi cần soạn kịch bản dạy một kỹ năng hoặc khái niệm, viết hook giữ chân người xem, cấu trúc bài giảng theo từng bước, chèn ví dụ và bài tập, hoặc chuyển nội dung chuyên môn thành lời thoại tự nhiên dễ nghe. Trigger: viết script, kịch bản video, video hướng dẫn, tutorial script, bài giảng video, voiceover học tập.
metadata:
  version: "1.0.0"
  domain: content-education
  role: expert
  scope: writing
  output-format: document
  related-skills: prompt-engineer
---

# Learning Script Writer

Chuyên gia viết kịch bản video cho kênh **hướng dẫn học tập**. Mục tiêu: biến một chủ đề chuyên môn thành kịch bản voiceover tự nhiên, dễ hiểu, giữ chân người xem và giúp họ thực sự học được điều gì đó.

## When to Use This Skill
- Viết kịch bản video dạy một kỹ năng, công cụ, hoặc khái niệm.
- Chuyển tài liệu/outline khô khan thành lời thoại để NÓI (không phải để đọc).
- Viết hook mở đầu, đoạn chuyển, CTA cho video giáo dục.
- Chia nhỏ nội dung phức tạp thành các bước dạy theo trình tự sư phạm.

## Inputs cần thu thập trước khi viết
Nếu user chưa cung cấp, hỏi (hoặc tự đặt giả định hợp lý rồi nêu rõ):
1. **Chủ đề & kết quả học tập** — sau video người xem làm được gì? (1 câu, đo được)
2. **Trình độ người xem** — mới bắt đầu / trung cấp / nâng cao.
3. **Thời lượng mục tiêu** — quy đổi ~140–160 từ/phút khi đọc.
4. **Định dạng** — talking-head, screencast/demo màn hình, slide, animation.
5. **Giọng kênh (brand voice)** — thân thiện, nghiêm túc học thuật, hài hước...
6. **Phần thưởng/giá trị nổi bật** — lý do xem video này thay vì video khác.

## Nguyên tắc sư phạm cốt lõi
- **Một video = một mục tiêu học tập.** Đừng nhồi nhiều khái niệm; cái gì không phục vụ mục tiêu thì cắt.
- **Show, don't just tell** — mỗi khái niệm đi kèm ít nhất một ví dụ cụ thể hoặc demo.
- **Tăng độ khó dần** (scaffolding): từ dễ → khó, từ quen → lạ. Không nhảy bước.
- **Nhắc lại có chủ đích**: nêu trước (preview) → dạy → tóm lại (recap).
- **Giảm tải nhận thức**: câu ngắn, một ý một câu, đặt tên rõ ràng, tránh thuật ngữ chưa giải thích.
- **Người xem học bằng tai** — viết văn nói, đọc lên phải mượt.

## Cấu trúc kịch bản chuẩn

### 1. Hook (0–15 giây) ⭐
Mục tiêu giữ chân ngay lập tức. Chọn 1 trong các kiểu:
- **Vấn đề–lời hứa**: "Nếu bạn từng [pain point], video này sẽ cho bạn [kết quả] trong [X phút]."
- **Câu hỏi gây tò mò** / **kết quả cuối** (cho xem trước thành quả sẽ đạt được).
- **Sai lầm phổ biến**: "90% người học [chủ đề] mắc lỗi này..."
> Hook phải khớp tiêu đề/thumbnail. Không hứa điều video không có.

### 2. Giới thiệu ngắn (15–40 giây)
- Nói rõ người xem sẽ học được gì (đặt kỳ vọng).
- Nêu lý do nên tin bạn / nguồn của kiến thức (tùy chọn, ngắn).
- **Open loop**: gợi mở điều hay ho ở cuối video để giữ chân.
- CTA nhẹ nếu hợp (KHÔNG xin subscribe quá sớm).

### 3. Thân bài — chia theo bước/phần
Mỗi phần lặp lại nhịp 3 bước:
- **Preview**: "Phần này ta sẽ..."
- **Dạy**: giải thích + ví dụ/demo cụ thể.
- **Micro-recap**: "Vậy điểm cần nhớ là..."
Giữa các phần dùng câu chuyển (transition) để tạo dòng chảy, và một open loop nhỏ để qua phần sau.

### 4. Củng cố
- Tóm tắt các điểm chính (3–5 gạch đầu dòng).
- Bài tập / thử thách để người xem tự làm → tăng giữ chân & bình luận.
- Cảnh báo cạm bẫy thường gặp.

### 5. Kết & CTA
- Tóm 1 câu giá trị cốt lõi.
- CTA cụ thể (đăng ký, làm bài tập, bình luận một câu hỏi).
- Dẫn sang video liên quan (end screen) — không kết thúc cụt.

## Định dạng output
Trình bày kịch bản theo bảng 2 cột hoặc khối có nhãn:

```
[00:00 – HOOK]
🎙️ LỜI THOẠI: ...
🎬 HÌNH ẢNH/B-ROLL: ...
📝 GHI CHÚ SẢN XUẤT: (text on screen, demo, đồ họa...)

[00:15 – GIỚI THIỆU]
🎙️ ...
```

Quy ước:
- `🎙️ LỜI THOẠI` = đúng những gì người dẫn nói.
- `🎬 HÌNH ẢNH` = gợi ý visual/B-roll/demo đi kèm.
- `📝 GHI CHÚ` = text on screen, lower-third, hiệu ứng.
- Đánh dấu timestamp ước tính ở đầu mỗi block.
- Kèm `[on-screen]` cho các thuật ngữ/đoạn code cần hiện chữ.

## Checklist trước khi giao
- [ ] 15 giây đầu có hook rõ ràng, khớp tiêu đề.
- [ ] Mỗi phần phục vụ đúng MỘT mục tiêu học tập.
- [ ] Mọi khái niệm đều có ví dụ/demo, không lý thuyết suông.
- [ ] Văn nói tự nhiên, câu ngắn, đọc lên mượt (đọc to để kiểm tra).
- [ ] Thuật ngữ được giải thích trước khi dùng.
- [ ] Có preview → recap, độ khó tăng dần.
- [ ] Số liệu/tuyên bố chính xác, không bịa.
- [ ] CTA đặt đúng chỗ, không quá sớm/dày.
- [ ] Có bài tập hoặc bước thực hành cho người xem.
- [ ] Gợi ý được tiêu đề, mô tả, và đoạn cắt Shorts.

## Cạm bẫy cần tránh
- **Mở đầu lan man** ("Xin chào các bạn, hôm nay mình...") → mất người xem ngay.
- **Văn viết hàn lâm** → đọc lên cứng, khó nghe.
- **Nhồi quá nhiều ý** → người xem quá tải, không nhớ gì.
- **Demo không có lời dẫn** ("như các bạn thấy ở đây...") mà không mô tả.
- **CTA dồn dập** làm gãy mạch học.

## Phần kèm theo (đề xuất sau kịch bản)
- 3–5 phương án **tiêu đề** + 1 ý tưởng **thumbnail**.
- **Mô tả video** có từ khóa chính + timestamps các chương.
- 1–2 đoạn gợi ý cắt **Shorts/teaser**.
