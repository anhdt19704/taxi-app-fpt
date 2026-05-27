const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Mật khẩu truy cập trang quản trị admin.html
const ADMIN_PASSWORD = 'admin123'; 

// Bộ nhớ lưu ma trận giá (Sẽ tự động cập nhật khi bạn chỉnh sửa số tiền/km trên Admin)
let priceMatrix = {
    HN_NB: { "5": "250.000đ", "7": "300.000đ", "16": "650.000đ", "29": "Thỏa thuận", "45": "Thỏa thuận" },
    NB_HN: { "5": "300.000đ", "7": "350.000đ", "16": "700.000đ", "29": "Thỏa thuận", "45": "Thỏa thuận" },
    PROVINCE: { "5": "Liên hệ", "7": "Liên hệ", "16": "Liên hệ", "29": "Liên hệ", "45": "Liên hệ" }
};

let bookings = []; // Lưu trữ danh sách lịch sử đơn đặt xe

// Cấu hình đọc dữ liệu từ Form/JSON gửi lên và đọc file static (HTML, CSS, JS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ==========================================
// 1. NHÓM API DÀNH CHO KHÁCH HÀNG (INDEX.HTML)
// ==========================================

// Khách xem bảng giá hiện tại
app.get('/api/prices', (req, res) => {
    res.json(priceMatrix);
});

// Tiếp nhận đơn đặt xe âm thầm từ khách hàng
app.post('/api/bookings', (req, res) => {
    const { customerName, phone, route, carType, price } = req.body;
    
    // Chuẩn hóa loại xe để hiển thị cột "Loại Xe" trên Admin không bị lặp từ
    let formattedCar = "Chưa chọn";
    if (carType) {
        formattedCar = carType.includes("chỗ") ? carType : `Xe ${carType} chỗ`;
    }

    // Tạo object đơn hàng khớp hoàn toàn với các cột trên bảng Admin của bạn
    const newBooking = {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        customerName: customerName && customerName !== phone ? customerName : "Khách đặt qua web", 
        phone: phone || "Không có",
        route: route || "Chưa rõ tuyến",
        carType: formattedCar,
        price: Number(price) || 0
    };

    bookings.unshift(newBooking); // Thêm đơn mới nhất lên trên cùng
    res.status(201).json({ success: true, message: "Đã ghi nhận đơn đặt xe!", data: newBooking });
});

// ==========================================
// 2. NHÓM API DÀNH CHO QUẢN TRỊ VIÊN (ADMIN.HTML)
// ==========================================

// Xác thực mật khẩu khi vừa truy cập trang Admin hoặc thay đổi giá tiền
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: "Mật khẩu Admin không chính xác!" });
});

// Lấy danh sách đơn hàng, đếm số chuyến và tính tổng doanh thu cộng dồn
app.get('/api/admin/bookings', (req, res) => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0);
    
    res.json({
        totalTrips: bookings.length,
        totalRevenue: totalRevenue,
        list: bookings
    });
});

// Cập nhật cấu hình giá tiền trên mỗi Km
app.post('/api/admin/update-prices', (req, res) => {
    const { password, kmPrice4, kmPrice7 } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "Sai mật khẩu! Không có quyền chỉnh sửa." });
    }

    if (kmPrice4 && kmPrice7) {
        // Tính toán lại giá trọn gói dựa trên số tiền/km nhân với quãng đường ước lượng (~30km)
        const price4Num = Number(kmPrice4) * 30;
        const price7Num = Number(kmPrice7) * 30;

        // Cập nhật tuyến Hà Nội -> Nội Bài (Tiễn)
        priceMatrix.HN_NB["5"] = price4Num.toLocaleString('vi-VN') + "đ";
        priceMatrix.HN_NB["7"] = price7Num.toLocaleString('vi-VN') + "đ";
        
        // Cập nhật tuyến Nội Bài -> Hà Nội (Đón - thường cộng thêm 50k phí bến bãi, sảnh chờ sân bay)
        priceMatrix.NB_HN["5"] = (price4Num + 50000).toLocaleString('vi-VN') + "đ";
        priceMatrix.NB_HN["7"] = (price7Num + 50000).toLocaleString('vi-VN') + "đ";

        return res.json({ success: true, message: "Cập nhật cấu hình giá tiền mới thành công!" });
    }
    
    res.status(400).json({ success: false, message: "Dữ liệu cấu hình gửi lên không hợp lệ." });
});

// Điều hướng tất cả các đường dẫn khác về trang chủ index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Mở cổng mạng kết nối
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống hoạt động mượt mà tại cổng: ${PORT}`);
});