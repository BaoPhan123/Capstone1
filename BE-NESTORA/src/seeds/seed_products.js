require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

const MONGODB_URI = process.env.MONGO_URI;

const categoryMapping = {
    1: 'phong-khach',
    2: 'phong-ngu',
    3: 'phong-bep',
    4: 'phong-tam',
    5: 'tre-em',
    6: 'van-phong',
    7: 'cau-thang',
    8: 'den-trang-tri'
};

const productsData = [
    { name: 'Giường Châu Âu', desc: 'Size lớn, trắng sữa', price: 8999000, image: 'sp-1.png', categoryId: 2 },
    { name: 'Bàn làm việc', desc: 'Size vừa, trắng nâu', price: 3999000, image: 'sp-2.png', categoryId: 6 },
    { name: 'Tủ quần áo', desc: '4 ngăn, trắng gỗ', price: 12999000, image: 'sp-3.png', categoryId: 2 },
    { name: 'Kệ để đồ', desc: '4 ngăn, trắng gỗ', price: 2499000, image: 'sp-4.png', categoryId: 1 },
    { name: 'Giường ngủ', desc: 'Size King, gỗ sồi', price: 15999000, image: 'giuong-ngu.png', categoryId: 2 },
    { name: 'Tủ quần áo lớn', desc: '6 ngăn, gỗ tự nhiên', price: 18999000, image: 'tu-quan-ao.png', categoryId: 2 },
    { name: 'Kệ đầu giường', desc: '2 ngăn, trắng sữa', price: 1999000, image: 'ke-dau-giuong.png', categoryId: 2 },
    { name: 'Bàn uống nước', desc: 'Gỗ sồi, hiện đại', price: 4999000, image: 'phong-khach-ban-uong-nuoc.png', categoryId: 1 },
    { name: 'Ghế sofa', desc: 'Vải cao cấp, êm ái', price: 7999000, image: 'ghe.png', categoryId: 1 },
    { name: 'Sofa phòng khách', desc: 'Da thật, sang trọng', price: 25999000, image: 'phong-khach.png', categoryId: 1 },
    { name: 'Bàn ăn gỗ sồi', desc: '6 người, gỗ tự nhiên', price: 12999000, image: 'phong-bep.png', categoryId: 3 },
    { name: 'Tủ lavabo', desc: 'Chống nước, hiện đại', price: 5999000, image: 'phong-tam.png', categoryId: 4 },
    { name: 'Giường trẻ em', desc: 'An toàn, màu sắc', price: 6999000, image: 'tre-em.png', categoryId: 5 },
    { name: 'Bàn học sinh', desc: 'Điều chỉnh chiều cao', price: 2999000, image: 'van-phong.png', categoryId: 6 },
    { name: 'Đèn chùm pha lê', desc: 'Sang trọng, hiện đại', price: 8999000, image: 'den-trang-tri.png', categoryId: 8 },
    { name: 'Lan can cầu thang', desc: 'Inox 304, bền đẹp', price: 15999000, image: 'cau-thang.png', categoryId: 7 },
];

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Đã kết nối MongoDB:", MONGODB_URI);

        await Product.deleteMany({});
        console.log("🗑️ Đã xóa tất cả sản phẩm cũ");

        const products = productsData.map(item => ({
            name: item.name,
            desc: item.desc,
            price: item.price,
            images: [item.image],
            category: categoryMapping[item.categoryId],
            description: item.desc,
            stock: Math.floor(Math.random() * 50) + 10
        }));

        const inserted = await Product.insertMany(products);
        console.log(`✅ Đã seed ${inserted.length} sản phẩm`);

        mongoose.connection.close();
        console.log("🔌 Đã đóng kết nối");
    } catch (error) {
        console.error("❌ Lỗi:", error);
        process.exit(1);
    }
}

run();
