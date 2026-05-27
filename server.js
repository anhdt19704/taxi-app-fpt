const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Các file lưu dữ liệu JSON
const DATA_FILE = path.join(__dirname, 'prices.json');
const HISTORY_FILE = path.join(__dirname, 'booking-history.json');

// Hàm đọc giá xe
function readPrices() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const defaultPrices = { price4: 11000, price7: 13000 };
            fs.writeFileSync(DATA_FILE, JSON.stringify(defaultPrices, null, 2));
            return defaultPrices;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return { price4: 11000, price7: 13000 };
    }
}

// Hàm đọc lịch sử đặt xe
function readHistory() {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
            return [];
        }
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

// --- CÁC API HỆ THỐNG ---

// 1. Lấy giá hiện tại
app.get('/api/prices', (req, res) => {
    res.json(readPrices());
});

// 2. Cập nhật giá (Dành cho Admin)
app.post('/api/update-price', (req, res) => {
    try {
        const { price4, price7 } = req.body;
        const updated = {
            price4: parseFloat(price4) || 11000,
            price7: parseFloat(price7) || 13000
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2));
        res.json({ success: true, message: "Cập nhật giá thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lưu cấu hình giá." });
    }
});

// 3. Đặt xe mới (Khách hàng tạo đơn và lưu lịch sử)
app.post('/api/bookings', (req, res) => {
    try {
        const { customerName, phone, route, carType, price } = req.body;
        
        if (!customerName || !phone || !route) {
            return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin!" });
        }

        const history = readHistory();
        const newBooking = {
            id: Date.now(),
            customerName,
            phone,
            route,
            carType: carType === '4' ? 'Xe 4 chỗ' : 'Xe 7 chỗ',
            price: parseFloat(price) || 0,
            date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        };

        history.unshift(newBooking); // Đưa chuyến mới nhất lên đầu danh sách
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

        res.json({ success: true, message: "Đặt xe thành công! Tài xế sẽ gọi bạn ngay.", booking: newBooking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống không thể đặt đơn." });
    }
});

// 4. Lấy thống kê tiền và lịch sử (Dành cho Admin)
app.get('/api/admin/statistics', (req, res) => {
    const history = readHistory();
    const totalRevenue = history.reduce((sum, item) => sum + item.price, 0);

    res.json({
        success: true,
        totalBookings: history.length,
        totalRevenue: totalRevenue,
        history: history
    });
});

// Chạy Server
app.listen(PORT, () => {
    console.log(`Hệ thống chạy mượt mà tại cổng: http://localhost:${PORT}`);
});