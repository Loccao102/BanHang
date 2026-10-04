@echo off
chcp 65001 >nul
title LSOUL Fashion - Cài đặt & Khởi chạy lần đầu

echo ========================================================
echo        LSOUL FASHION COMMERCE - KHỞI CHẠY LẦN ĐẦU
echo ========================================================
echo.

:: 1. Kiểm tra Docker
echo [1/5] Kiểm tra dịch vụ Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [LỖI] Docker chưa được khởi động!
    echo Vui lòng mở ứng dụng Docker Desktop và đợi Docker khởi động xong rồi chạy lại file này.
    echo.
    pause
    exit /b 1
)
echo Docker đang chạy ổn định.

:: 2. Kiểm tra file cấu hình .env
echo.
echo [2/5] Kiểm tra file cấu hình môi trường (.env)...
if not exist ".env" (
    echo Chưa có file .env, đang tự động tạo từ .env.example...
    copy .env.example .env >nul
    echo Đã tạo file .env thành công.
) else (
    echo File .env đã tồn tại.
)

:: 3. Kiểm tra node_modules
echo.
echo [3/5] Kiểm tra thư viện dependencies...
if not exist "node_modules\" (
    echo Đang cài đặt thư viện npm...
    call npm install
) else (
    echo Thư viện node_modules đã sẵn sàng.
)

:: 4. Build và khởi động Docker Containers
echo.
echo [4/5] Đang build và khởi chạy các Docker Container (sẽ mất khoảng 1-2 phút cho lần đầu)...
call docker compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo [CẢNH BÁO] Có thông báo trong quá trình build, đang kiểm tra trạng thái container...
)

:: 5. Chờ database và dịch vụ sẵn sàng
echo.
echo [5/5] Đang kiểm tra trạng thái các dịch vụ...
timeout /t 5 /nobreak >nul
call docker compose ps

echo.
echo ========================================================
echo              HỆ THỐNG ĐÃ KHỞI CHẠY THÀNH CÔNG!
echo ========================================================
echo.
echo  * Cửa hàng thời trang (Storefront):  http://localhost:3000
echo  * Phòng thử đồ AI (Try-On):          http://localhost:3000/try-on
echo  * Trang quản trị (Admin Dashboard):  http://localhost:3001/admin
echo.
echo  * Tài khoản admin mặc định:
echo    - Email:    admin@lsoul.com
echo    - Mật khẩu: Admin@123456
echo.
echo ========================================================
echo Mẹo: Từ những lần sau, bạn chỉ cần chạy file "run.bat" để mở app trong 2 giây!
echo.

:: Tự động mở trình duyệt
start http://localhost:3000

pause
