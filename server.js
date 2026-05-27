const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Mật khẩu đăng nhập vào trang admin.html
const ADMIN_PASSWORD = 'admin123';

// Bộ nhớ lưu ma trận giá mặc định (Số tiền trọn gói cho tuyến đường ~30km)
let priceMatrix = {
    "Xe 4 chỗ nhỏ gọn": 250000,
    "Xe 7 chỗ rộng rãi": 350000
};

let bookings = []; // Mảng tạm thời lưu danh sách đơn đặt xe của khách

// Middleware cấu hình đọc dữ liệu JSON/Form và phục vụ file tĩnh (HTML, CSS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ==========================================
// 1. CÁC API DÀNH CHO TRANG KHÁCH HÀNG (INDEX.HTML)
// ==========================================

// API lấy dữ liệu bảng giá hiện tại
app.get('/api/prices', (req, res) => {
    res.json(priceMatrix);
});

// API tiếp nhận đơn đặt xe từ Form gửi lên
app.post('/api/bookings', (req, res) => {
    const { customerName, phone, route, carType } = req.body;
    
    // Tự động tính giá tiền dựa trên loại xe khách chọn trong ma trận giá
    let finalPrice = priceMatrix["Xe 4 chỗ nhỏ gọn"]; 
    if (carType && carType.includes("7")) {
        finalPrice = priceMatrix["Xe 7 chỗ rộng rãi"];
    }

    // Tạo cấu trúc dữ liệu đơn hàng mới cho trang Admin
    const newBooking = {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        customerName: customerName || "Khách ẩn danh",
        phone: phone || "Không có",
        route: route || "Hà Nội ↔ Nội Bài",
        carType: carType || "Xe 4 chỗ",
        price: finalPrice
    };

    bookings.unshift(newBooking); // Đẩy đơn mới nhất lên đầu danh sách
    console.log(" Ghi nhận đơn đặt xe mới:", newBooking);
    
    res.status(201).json({ success: true, message: "Đặt xe thành công!", data: newBooking });
});

// ==========================================
// 2. CÁC API DÀNH CHO TRANG QUẢN TRỊ (ADMIN.HTML)
// ==========================================

// API xác thực mật khẩu Admin
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: "Mật khẩu không chính xác!" });
});

// API lấy toàn bộ báo cáo doanh thu & danh sách đơn hàng
app.get('/api/admin/bookings', (req, res) => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0);
    res.json({
        totalTrips: bookings.length,
        totalRevenue: totalRevenue,
        list: bookings
    });
});

// API cập nhật cấu hình giá tiền/km từ trang Admin công dồn ra giá trọn gói
app.post('/api/admin/update-prices', (req, res) => {
    const { password, kmPrice4, kmPrice7 } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "Không có quyền chỉnh sửa!" });
    }

    if (kmPrice4 && kmPrice7) {
        // Tính toán lại giá tiền dựa trên giá/km nhập vào nhân với khoảng cách 30km đi Nội Bài
        priceMatrix["Xe 4 chỗ nhỏ gọn"] = Number(kmPrice4) * 30;
        priceMatrix["Xe 7 chỗ rộng rãi"] = Number(kmPrice7) * 30;
        console.log(` Cập nhật giá mới: 4 chỗ = ${kmPrice4}đ/km, 7 chỗ = ${kmPrice7}đ/km`);
        return res.json({ success: true, message: "Cập nhật giá thành công!" });
    }
    
    res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ." });
});

// Điều hướng mặc định: Nếu gõ sai đường dẫn, tự động quay về trang chủ index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Kích hoạt cổng lắng nghe mạng
app.listen(PORT, () => {
    console.log(`🚀 Server chạy thành công tại cổng: ${PORT}`);
});