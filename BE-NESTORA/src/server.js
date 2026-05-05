require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const { connectDB } = require("./config/db");
const cors = require("cors");
const path = require("path");
const ApiRes = require("./utils/response");
// const { setupVectorIndex } = require("./services/openai.service");

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors("*"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


const routes = require("./routes");
app.use("/api", routes);

app.use((req, res) => {
  return ApiRes.send(res, { statusCode: 404, success: false, message: "Không tìm đường dẫn" });
});

app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Lỗi hệ thống";
  const errors = err.errors || null;
  return ApiRes.send(res, { statusCode, success: false, message, errors });
});





const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDB();
    console.log("✅ Đã kết nối MongoDB");

    // await setupVectorIndex();

    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Lỗi khi khởi động server:", error);
    process.exit(1);
  }
}

startServer();
