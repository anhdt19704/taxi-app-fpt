const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// CẤU HÌNH
const ADMIN_PASSWORD = 'fpt2026';
let bookings = []; 

let priceMatrix = {
    "HN_NB": { "5": 250000, "7": 350000, "16": 600000, "29": 1200000, "45": 1800000 },
    "NB_HN": { "5": 250000, "7": 350000, "16": 600000, "29": 1200000, "45": 1800000 },
    "PROVINCE": { "5": 500000, "7": 700000, "16": 1200000, "29": 2000000, "45": 3000000 }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// API cho người dùng
app.get('/api/prices', (req, res) => res.json(priceMatrix));

app.post('/api/bookings', (req, res) => {
    const newBooking = { 
        ...req.body, 
        id: Date.now(), 
        date: new Date().toLocaleString('vi-VN') 
    };
    bookings.unshift(newBooking);
    console.log("Đơn hàng mới đã được lưu:", newBooking);
    res.json({ success: true });
});

// API cho Admin
app.post('/api/admin/verify', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) res.json({ success: true });
    else res.status(401).json({ success: false });
});

app.post('/api/update-price', (req, res) => {
    const { route, carType, newPrice } = req.body;
    const cleanPrice = parseInt(newPrice.replace(/[^0-9]/g, ''));
    if (priceMatrix[route]) {
        priceMatrix[route][carType] = cleanPrice;
        res.json({ success: true });
    } else res.status(400).json({ success: false });
});

app.get('/api/admin/statistics', (req, res) => {
    res.json({
        success: true,
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + (parseInt(b.price) || 0), 0),
        history: bookings
    });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Server đang chạy tại cổng ${PORT}`));