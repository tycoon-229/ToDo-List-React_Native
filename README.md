Dưới đây là nội dung toàn bộ file **`README.md`** hoàn chỉnh cho dự án TodoList phong cách Cyberpunk của bạn. Bạn chỉ cần copy toàn bộ đoạn bên dưới và paste vào file `README.md` trong thư mục gốc dự án.

```markdown
# 🤖 CYBORG TODOLIST — Hệ Thống Quản Lý Nhiệm Vụ Phong Cách Cyberpunk

> **Giao thức quản lý công việc thế hệ mới:** Tích hợp giao diện Cyberpunk HUD (Dark/Light Neon), đồng bộ dữ liệu thời gian thực qua Supabase, quản lý trạng thái bằng Redux Toolkit và hỗ trợ đếm ngược Focus/Pomodoro.

---

## ⚡ Tính Năng Nổi Bật

- 🎨 **Giao diện Cyberpunk HUD:**
  - Hỗ trợ 2 bộ màu `CYBER_DARK` (Xanh Neon trên nền đen tuyền) và `CYBER_LIGHT` (Metal Chrome).
  - Hiệu ứng chữ nhiễu sóng (`GlitchText`) và Typewriter animation.
  - Tùy chỉnh Avatar & Banner hoạt hình GIF thông qua Supabase Bucket Storage.
- 📋 **Quản Lý Nhiệm Vụ Nâng Cao (Task Protocols):**
  - Khởi tạo node công việc kèm tiêu đề, mô tả, độ ưu tiên (`LOW`, `MEDIUM`, `HIGH`), hạn chót (Deadline) và giờ nhắc nhở.
  - Hỗ trợ công việc lặp lại theo chu kỳ (`DAILY`, `WEEKLY`, `MONTHLY`) và đếm chuỗi liên tục (Streak Counter 🔥).
  - Quản lý danh mục (Categories) có gắn màu nhận diện và hệ thống Subtasks (Task con).
- 🔍 **Ma Trận Lọc & Tìm Kiếm (Query Matrix):**
  - Tìm kiếm thời gian thực theo tên, mô tả hoặc `#tag`.
  - Bộ lọc đa chiều theo Trạng thái (`TODO` / `COMPLETED`), Độ ưu tiên và Danh mục.
  - Sắp xếp thứ tự danh sách theo hạn chót.
- 🎯 **Chế Độ Tập Trung (Focus Protocol / Pomodoro):**
  - Bộ đếm thời gian tập trung linh hoạt (Focus / Short Break / Long Break) gắn trực tiếp với task.
  - Phát âm thanh cảnh báo tần số sóng tổng hợp (Web Audio API) khi kết thúc chu kỳ.
- 📊 **Thống Kê Tiến Độ (Telemetry Stats):**
  - Chỉ số hiệu suất tổng quan (Optimal / Nominal / Degraded).
  - Biểu đồ năng suất phân tích theo Ngày, Tuần, Tháng.
  - Biểu đồ phân bổ tỷ lệ khối lượng công việc theo danh mục.
- 🗑️ **Vùng Cách Ly (Quarantine Vault):**
  - Cơ chế xóa mềm (`softDelete`) đưa nhiệm vụ vào Vùng cách ly.
  - Hỗ trợ khôi phục (Restore) hoặc tiêu hủy vĩnh viễn (Purge).
- 🌐 **Đa Ngôn Ngữ & Múi Giờ:**
  - Chuyển đổi linh hoạt Tiếng Việt (`VI`) và Tiếng Anh (`EN`).
  - Tự động định dạng ngày giờ theo múi giờ khu vực (Asia/Ho_Chi_Minh, UTC, Asia/Tokyo...).

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework:** React Native / Native Android (Xử lý bằng Gradle)
- **Routing:** Expo Router
- **State Management:** Redux Toolkit + React-Redux
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage Bucket)
- **Local Storage:** `@react-native-async-storage/async-storage`
- **Audio & Push:** Web Audio API & Web Push Notifications
- **Styling:** React Native `StyleSheet` tùy biến theo Theme Palette

---

## 🚀 Hướng Dẫn Cài Đặt Và Chạy Dự Án

### 1. Môi trường yêu cầu
- Node.js version `>= 18.x`
- Java Development Kit (JDK) 17
- Android Studio (kèm Android SDK Platform 34)

### 2. Cài đặt Dependencies
```bash
# Clone dự án hoặc tải mã nguồn
cd TodoList

# Cài đặt các gói phụ thuộc
npm install

```

### 3. Cấu hình biến môi trường / Supabase

Tạo hoặc cập nhật cấu hình Supabase trong file `src/services/supabase.ts`:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

```

---

## 📱 Biên Dịch Ứng Dụng (Build App Android APK)

Nếu bạn muốn đóng gói ứng dụng trực tiếp trên máy tính cá nhân mà không phụ thuộc vào server đám mây Expo:

### Bước 1: Sinh mã nguồn Android gốc

```bash
npx expo prebuild --clean

```

### Bước 2: Build file APK bằng Gradle

Di chuyển vào thư mục `android` và chạy lệnh build:

* **Bản Debug APK (Chạy thử ngay trên máy):**
```powershell
cd android
.\gradlew assembleDebug

```


*File APK xuất ra tại:* `android/app/build/outputs/apk/debug/app-debug.apk`
* **Bản Release APK (Bản chính thức tối ưu):**
```powershell
cd android
.\gradlew assembleRelease

```


*File APK xuất ra tại:* `android/app/build/outputs/apk/release/app-release.apk`

---

## 📂 Cấu Trúc Mã Nguồn

```text
TodoList/
├── android/                 # Mã nguồn Android Native gốc (Sau khi prebuild)
├── src/
│   ├── app/                 # Các màn hình chính (Expo Router)
│   │   ├── index.tsx        # Màn hình chính (Home & Task DB)
│   │   ├── login.tsx        # Màn hình Đăng nhập
│   │   ├── register.tsx     # Màn hình Đăng ký
│   │   ├── settings.tsx     # Cài đặt Hồ sơ & Giao diện
│   │   ├── calendar.tsx     # Lịch trình & Timeline
│   │   ├── focus.tsx        # Chế độ tập trung (Pomodoro)
│   │   ├── analytics.tsx    # Thống kê tiến độ
│   │   ├── categories.tsx   # Quản lý danh mục
│   │   ├── quarantine.tsx   # Vùng cách ly (Thùng rác)
│   │   └── task/[id].tsx    # Chi tiết nhiệm vụ
│   ├── components/          # Reusable Components (CustomButton, GlitchText, TaskItem)
│   ├── constants/           # Bảng màu (Colors.ts) & Bản dịch (translations.ts)
│   ├── features/            # Redux Slices (tasks, auth, categories, settings, subtasks)
│   ├── hooks/               # Custom Hooks (useThemeColors, useTranslation...)
│   ├── services/            # Supabase Client, Storage Service, Notification Service
│   └── store/               # Cấu hình Redux Store & Hooks
├── app.json                 # Cấu hình dự án Expo / Package Name
└── package.json

```

---

⚡ *Cyborg TodoList Project — Designed for High Efficiency Operatives.*

```

```
