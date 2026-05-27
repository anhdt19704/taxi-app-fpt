const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình bảo mật và mật khẩu quản trị viên (ADMIN)
const ADMIN_PASSWORD = 'admin123'; 

// Bộ nhớ tạm thời lưu dữ liệu (Khi restart server trên Render Free, dữ liệu sẽ reset về mặc định)
let priceMatrix = {
    HN_NB: { "5": "250.000đ", "7": "300.000đ", "16": "650.000đ", "29": "Thỏa thuận", "45": "Thỏa thuận" },
    NB_HN: { "5": "300.000đ", "7": "350.000đ", "16": "700.000đ", "29": "Thỏa thuận", "45": "Thỏa thuận" },
    PROVINCE: { "5": "Liên hệ", "7": "Liên hệ", "16": "Liên hệ", "29": "Liên hệ", "45": "Liên hệ" }
};

let bookings = []; // Mảng danh sách lưu lịch sử đơn đặt xe của khách

// Middleware cấu hình đọc dữ liệu JSON và phục vụ file tĩnh (HTML, CSS, JS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ==========================================
// 1. CÁC API DÀNH CHO TRANG ĐẶT XE (INDEX.HTML)
// ==========================================

// API lấy bảng giá hiện tại để hiển thị lên UI cho khách xem
app.get('/api/prices', (req, res) => {
    res.json(priceMatrix);
});

// API tiếp nhận đơn đặt xe âm thầm từ khách hàng khi bấm nút "ĐẶT XE QUA ZALO"
app.post('/api/bookings', (req, res) => {
    const { customerName, phone, route, carType, price } = req.body;
    
    // Tạo cấu trúc một đơn hàng mới phục vụ trang Admin
    const newBooking = {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        customerName: customerName || "Khách ẩn danh",
        phone: phone || "Không có",
        route: route || "Chưa rõ tuyến",
        carType: carType ? `Xe ${carType} chỗ` : "Chưa chọn loại xe",
        price: Number(price) || 0
    };

    bookings.unshift(newBooking); // Đẩy đơn mới lên đầu danh sách
    res.status(201).json({ success: true, message: "Đã ghi nhận đơn đặt xe!", data: newBooking });
});

// ==========================================
// 2. CÁC API DÀNH CHO TRANG QUẢN TRỊ (ADMIN.HTML)
// ==========================================

// API xác thực mật khẩu khi vừa truy cập trang Admin hoặc thay đổi giá tiền
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: "Mật khẩu Admin không chính xác!" });
});

// API lấy toàn bộ danh sách đơn hàng & tổng doanh thu phục vụ báo cáo trên Admin
app.get('/api/admin/bookings', (req, res) => {
    // Tính toán tổng doanh thu tạm tính cộng dồn từ các đơn xe
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0);
    
    res.json({
        totalTrips: bookings.length,
        totalRevenue: totalRevenue,
        list: bookings
    });
});

// API cập nhật cấu hình giá tiền trên mỗi Km (Ví dụ nâng giá / hạ giá)
app.post('/api/admin/update-prices', (req, res) => {
    const { password, kmPrice4, kmPrice7 } = req.body;
    
    // Bảo mật: Kiểm tra mật khẩu trước khi cho sửa giá
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "Sai mật khẩu! Không có quyền chỉnh sửa." });
    }

    if (kmPrice4 && kmPrice7) {
        // Log dữ liệu kiểm tra trên Terminal Render
        console.log(`Cập nhật giá tiền mới: Xe 4 chỗ: ${kmPrice4}đ/km, Xe 7 chỗ: ${kmPrice7}đ/km`);
        
        // Cập nhật lại ma trận giá dựa trên giá tiền/km nhân với khoảng cách ước lượng (~30km đi Nội Bài)
        const price4Num = Number(kmPrice4) * 30;
        const price7Num = Number(kmPrice7) * 30;

        priceMatrix.HN_NB["5"] = price4Num.toLocaleString('vi-VN') + "đ";
        priceMatrix.HN_NB["7"] = price7Num.toLocaleString('vi-VN') + "đ";
        
        priceMatrix.NB_HN["5"] = (price4Num + 50000).toLocaleString('vi-VN') + "đ"; // Đón chiều về thường cộng thêm phí bến bãi
        priceMatrix.NB_HN["7"] = (price7Num + 50000).toLocaleString('vi-VN') + "đ";

        return res.json({ success: true, message: "Cập nhật cấu hình giá tiền mới thành công!" });
    }
    
    res.status(400).json({ success: false, message: "Dữ liệu cấu hình gửi lên không hợp lệ." });
});

// Điều hướng mặc định nếu người dùng gõ sai đường dẫn
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Kích hoạt lắng nghe cổng mạng
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống ngon lành tại: http://localhost:${PORT}`);
});