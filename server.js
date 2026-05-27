const express = require('express');
const path = require('path');
const fs = require('fs'); // Thư viện đọc ghi file của Node.js
const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_FILE = path.join(__dirname, 'prices.json');

// Ma trận giá mặc định (chỉ dùng khi chưa có file prices.json)
const defaultPriceMatrix = {
    "HN_NB": { "5": "250.000đ", "7": "300.000đ", "16": "500.000đ", "29": "1.000.000đ", "45": "1.500.000đ" },
    "NB_HN": { "5": "300.000đ", "7": "350.000đ", "16": "600.000đ", "29": "1.000.000đ", "45": "1.500.000đ" },
    "PROVINCE": { "5": "Liên hệ", "7": "Liên hệ", "16": "Liên hệ", "29": "Liên hệ", "45": "Liên hệ" }
};

// Hàm đọc giá từ file json lên
function readPricesFromFile() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileData = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(fileData);
        }
    } catch (error) {
        console.error("Lỗi đọc file, dùng giá mặc định:", error);
    }
    return defaultPriceMatrix;
}

// Hàm ghi giá xuống file json để lưu trữ vĩnh viễn
function writePricesToFile(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Lỗi ghi file:", error);
    }
}

// API 1: Trả về bảng giá hiện tại cho cả Khách và Admin
app.get('/api/prices', (req, res) => {
    const currentPrices = readPricesFromFile();
    res.json(currentPrices);
});

// API 2: Nhận giá mới từ Admin và lưu vào file cứng
app.post('/api/update-price', (req, res) => {
    const { route, carType, newPrice } = req.body;
    let currentPrices = readPricesFromFile();

    if (currentPrices[route]) {
        currentPrices[route][carType] = newPrice;
        writePricesToFile(currentPrices); // Ghi lại vào file prices.json
        res.json({ success: true, message: "Đã lưu giá vĩnh viễn vào file hệ thống!" });
    } else {
        res.status(400).json({ success: false, message: "Lộ trình không hợp lệ!" });
    }
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`🚀 Hệ thống ngon lành tại: http://localhost:${PORT}`);
});