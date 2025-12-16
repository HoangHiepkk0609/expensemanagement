const { GoogleGenerativeAI } = require("@google/generative-ai");

// Thay API KEY của bạn vào đây
const genAI = new GoogleGenerativeAI("AIzaSyBFS4Y6Uh_RetsbKorPizzPucroLGE9K5E"); 

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // Cách này dùng để list models hơi khác tùy version, 
    // nhưng ta cứ thử gọi 1 lệnh đơn giản xem model nào chạy
    console.log("Đang kiểm tra kết nối...");
    const result = await model.generateContent("Hello");
    console.log("Gemini 1.5 Flash hoạt động tốt!");
    console.log(result.response.text());
  } catch (error) {
    console.log("Lỗi model:", error.message);
  }
}

listModels();