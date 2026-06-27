---
title: Pomodoro là widget nổi toàn cục, không phải trang
date: 2026-06-27
tags: [pomodoro, widget, decision, layout]
---

## Bối cảnh / Vấn đề
Ban đầu Pomodoro là trang `/dashboard/focus`. Yêu cầu: luôn nổi (như chat widget), góc trên-phải
dưới navbar. Đổi trang sẽ làm mất đồng hồ đang chạy → cần kiến trúc khác.

## Nội dung
**Quyết định:**
- **Một component widget** (`pomodoro-widget.tsx`) **mount toàn cục** ở `(dashboard)/layout.tsx`,
  **tự sở hữu toàn bộ state đồng hồ**. Vì layout không remount khi điều hướng giữa các trang
  dashboard → đồng hồ **chạy liên tục xuyên trang và khi thu nhỏ**.
- **Thu/mở chỉ đổi JSX hiển thị**, không unmount logic → không reset interval. Pill thu nhỏ đọc
  cùng state để hiện mm:ss trực tiếp.
- **Decoupled open:** dùng `window` CustomEvent **`pomodoro:open`** để nút ở component khác bung
  widget mà không cần shared store/context. Widget `addEventListener` trong `useEffect`.

**Phương án bị loại:**
- *Giữ trang riêng:* mất đồng hồ khi rời trang.
- *Zustand/Context để chia sẻ trạng thái mở:* thừa cho 1 tín hiệu "mở"; event đủ nhẹ.
- *Tách timer thành component con + lift state lên:* đã gộp luôn logic vào widget cho gọn
  (đã xóa `PomodoroTimer` cũ).

**Hệ quả:** đã xóa trang `/dashboard/focus`, mục nav "Tập trung", component `PomodoroTimer`.
Nếu sau này cần nhiều nơi điều khiển sâu (pause từ xa…) thì cân nhắc store.

## Liên quan
- [[study-engagement]] — chi tiết luồng dữ liệu + leaderboard
