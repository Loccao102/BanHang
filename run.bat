@echo off
chcp 65001 >nul
title LSOUL Fashion - Khởi động nhanh

echo ========================================================
echo        LSOUL FASHION COMMERCE - KHỞI ĐỘNG HỆ THỐNG
echo ========================================================
echo.

:: 1. Kiểm tra Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [LỖI] Docker chưa được khởi động!
    echo Vui lòng mở Docker Desktop lên trước khi chạy file này.
    echo.
    pause
    exit /b 1
)

:: 2. Khởi động nhanh các container (không build lại, khởi động trong 2-3 giây)
echo Đang bật các container (Store, Admin, Database)...
call docker compose up -d

echo.
timeout /t 2 /nobreak >nul
call docker compose ps

echo.
echo ========================================================
echo                 HỆ THỐNG ĐÃ SẴN SÀNG!
echo ========================================================
echo.
echo  * Cửa hàng thời trang (Storefront):  http://localhost:3000
echo  * Phòng thử đồ AI (Try-On):          http://localhost:3000/try-on
echo  * Trang quản trị (Admin Dashboard):  http://localhost:3001/admin
echo.
echo (Để tắt hệ thống khi dùng xong, hãy chạy file "stop.bat")
echo ========================================================
echo.

:: Tự động mở trình duyệt
start http://localhost:3000

pause
