@echo off
chcp 65001 >nul
title LSOUL Fashion - Dừng hệ thống

echo ========================================================
echo        LSOUL FASHION COMMERCE - DỪNG HỆ THỐNG
echo ========================================================
echo.

echo Đang tạm dừng các container an toàn...
call docker compose stop

echo.
echo Đã dừng hệ thống thành công! Dữ liệu của bạn vẫn được lưu trữ nguyên vẹn.
echo.
pause
