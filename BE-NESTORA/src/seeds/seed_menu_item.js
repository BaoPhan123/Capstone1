require("dotenv").config();
const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem"); // <-- sửa path nếu khác

const MONGODB_URI = process.env.MONGO_URI

// Tạo khung giờ khuyến mại "hôm nay" cho dễ test (14:00–17:00)
function promoWindowToday(startHH = 14, startMM = 0, endHH = 17, endMM = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(startHH, startMM, 0, 0);
  const end = new Date(now);
  end.setHours(endHH, endMM, 0, 0);
  return { start, end };
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected:", MONGODB_URI);

  await MenuItem.deleteMany({});

  const { start, end } = promoWindowToday(14, 0, 17, 0);

  const docs = [
    {
      name: "Phở Bò Tái",
      description: "Phở bò tái, nước dùng trong, vị ngọt xương.",
      category: "Món Chính",
      thumbnail: "https://example.com/img/pho-tai-thumb.jpg",
      images: [
        "https://example.com/img/pho-tai-1.jpg",
        "https://example.com/img/pho-tai-2.jpg"
      ],
      tags: ["pho", "bo", "noodle"],
      type: "food",

      isAvailable: true,

      preparationTime: "10-15 phút",
      portion: "1 tô",

      ingredients: ["Bánh phở", "Thịt bò tái", "Hành lá", "Gừng", "Quế"],
      nutritionalInformation: [
        { name: "Calories", value: 380, unit: "kcal" },
        { name: "Protein", value: 22, unit: "g" },
        { name: "Carbs", value: 55, unit: "g" }
      ],

      rate: 4.6,
      rateCount: 245,

      price: 55000,
      discountPrice: 50000,
      discountStartAt: start,
      discountEndAt: end
    },
    {
      name: "Cơm Gà Hội An",
      description: "Cơm gà xé, nước mắm gừng, dưa chuột.",
      category: "Món Chính",
      thumbnail: "https://example.com/img/com-ga-thumb.jpg",
      images: ["https://example.com/img/com-ga-1.jpg"],
      tags: ["com", "ga", "rice"],
      type: "food",

      isAvailable: true,

      preparationTime: "12-15 phút",
      portion: "1 đĩa",

      ingredients: ["Gà ta", "Cơm nghệ", "Rau răm", "Hành phi"],
      nutritionalInformation: [
        { name: "Calories", value: 520, unit: "kcal" },
        { name: "Protein", value: 24, unit: "g" }
      ],

      rate: 4.4,
      rateCount: 180,

      price: 60000,
      discountPrice: null,
      discountStartAt: null,
      discountEndAt: null
    },
    {
      name: "Bún Chả Hà Nội",
      description: "Chả nướng than hoa, nước chấm chua ngọt.",
      category: "Món Chính",
      thumbnail: "https://example.com/img/bun-cha-thumb.jpg",
      images: ["https://example.com/img/bun-cha-1.jpg"],
      tags: ["bun", "cha", "grill"],
      type: "food",

      isAvailable: true,

      preparationTime: "12-18 phút",
      portion: "1 suất",

      ingredients: ["Chả thịt", "Bún", "Rau sống", "Nước chấm"],
      nutritionalInformation: [{ name: "Calories", value: 650, unit: "kcal" }],

      rate: 4.7,
      rateCount: 310,

      price: 70000,
      discountPrice: 65000,
      discountStartAt: start,
      discountEndAt: end
    },
    {
      name: "Trà Đào Cam Sả",
      description: "Trà đào mát lạnh, thơm sả, lát cam tươi.",
      category: "Đồ Uống",
      thumbnail: "https://example.com/img/tra-dao-thumb.jpg",
      images: [
        "https://example.com/img/tra-dao-1.jpg",
        "https://example.com/img/tra-dao-2.jpg"
      ],
      tags: ["tra", "dao", "drink"],
      type: "drink",

      isAvailable: true,

      preparationTime: "3-5 phút",
      portion: "Ly 500ml",

      ingredients: ["Trà đen", "Đào ngâm", "Sả", "Cam"],
      nutritionalInformation: [
        { name: "Calories", value: 120, unit: "kcal" },
        { name: "Sugar", value: 18, unit: "g" }
      ],

      rate: 4.8,
      rateCount: 520,

      price: 35000,
      discountPrice: 30000,
      discountStartAt: start,
      discountEndAt: end
    },
    {
      name: "Cà Phê Sữa Đá",
      description: "Cà phê phin, sữa đặc, vị đậm đà.",
      category: "Đồ Uống",
      thumbnail: "https://example.com/img/cf-sua-da-thumb.jpg",
      images: ["https://example.com/img/cf-sua-da-1.jpg"],
      tags: ["ca phe", "sua", "drink"],
      type: "drink",

      isAvailable: true,

      preparationTime: "2-4 phút",
      portion: "Ly 300ml",

      ingredients: ["Cà phê", "Sữa đặc", "Đá"],
      nutritionalInformation: [{ name: "Calories", value: 180, unit: "kcal" }],

      rate: 4.9,
      rateCount: 800,

      price: 25000,
      discountPrice: null,
      discountStartAt: null,
      discountEndAt: null
    },
    {
      name: "Gỏi Cuốn Tôm Thịt",
      description: "Cuốn tươi, nước chấm tương đậu phộng.",
      category: "Khai Vị",
      thumbnail: "https://example.com/img/goi-cuon-thumb.jpg",
      images: ["https://example.com/img/goi-cuon-1.jpg"],
      tags: ["goi", "cuon", "appetizer"],
      type: "food",

      isAvailable: true,

      preparationTime: "5-7 phút",
      portion: "3 cuốn",

      ingredients: ["Bánh tráng", "Tôm", "Thịt", "Bún", "Rau sống"],
      nutritionalInformation: [
        { name: "Calories", value: 210, unit: "kcal" },
        { name: "Protein", value: 10, unit: "g" }
      ],

      rate: 4.3,
      rateCount: 95,

      price: 30000,
      discountPrice: 27000,
      discountStartAt: start,
      discountEndAt: end
    }
  ];

  await MenuItem.insertMany(docs);
  console.log("🌱 Seeded", docs.length, "menu items");

  await mongoose.disconnect();
  console.log("🔌 Disconnected");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});