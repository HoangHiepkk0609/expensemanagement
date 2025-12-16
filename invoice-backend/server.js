const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- CẤU HÌNH ---
const PORT = 3000;
// ⚠️ THAY API KEY CỦA BẠN VÀO DƯỚI ĐÂY
const GEMINI_API_KEY = "AIzaSyBFS4Y6Uh_RetsbKorPizzPucroLGE9K5E"; 

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Dùng model Flash cho nhanh và miễn phí
const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

app.post('/process-invoice', upload.single('invoice'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  try {
    console.log('⚡ Đang gửi ảnh lên Gemini...');

    // 1. Chuyển ảnh sang base64 để gửi cho AI
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    // 2. Ra lệnh cho AI (Prompt)
    const prompt = `
      Bạn là một chuyên gia đọc hóa đơn. Hãy trích xuất thông tin từ ảnh này và trả về JSON.
      Yêu cầu output (chỉ trả về JSON thuần, không markdown):
      {
        "total": "Tổng số tiền thanh toán (chỉ lấy số)",
        "store_name": "Tên cửa hàng",
        "date": "Ngày hóa đơn (định dạng YYYY-MM-DD). Nếu không thấy năm, dùng năm 2025"
      }
    `;

    // 3. Gọi Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log('🤖 Gemini trả lời:', text);

    // 4. Làm sạch chuỗi JSON (phòng khi AI thêm ký tự lạ)
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);

    console.log('✅ Kết quả:', data);
    res.json(data);

  } catch (error) {
    console.error('❌ Lỗi xử lý:', error);
    // Trả về rỗng để App không bị crash
    res.json({ total: '', store_name: '', date: '' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server Gemini đang chạy ở cổng ${PORT}`);
});