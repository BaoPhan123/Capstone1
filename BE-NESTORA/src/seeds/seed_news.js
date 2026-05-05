require("dotenv").config();
const mongoose = require("mongoose");
const News = require("../models/News");
const NewsCategory = require("../models/NewsCategory");
const User = require("../models/User");
const { DEFAULT_NEWS_CATEGORIES } = require("../constants/newsCategories");

const MONGODB_URI = process.env.MONGO_URI;

const newsData = [
    {
        title: 'TUYỆT CHIÊU THIẾT KẾ CHUNG CƯ MINI 2 PHÒNG NGỦ SIÊU ĐẸP',
        desc: 'Độ tuổi khởi nghiệp và tự lập ngày càng trẻ hóa trong xã hội hiện đại thời nay, thế nên việc "thiết kế" một không gian sống nhỏ gọn nhưng đầy đủ tiện nghi là điều cần thiết.',
        image: 'tintuc-6.png',
        slug: 'tuyet-chieu-thiet-ke-chung-cu-mini-2-phong-ngu-sieu-dep',
        category: 'thiet-ke-noi-that',
        content: `
            <p>Độ tuổi khởi nghiệp và tự lập ngày càng trẻ hóa trong xã hội hiện đại thời nay, thế nên việc "thiết kế" một không gian sống nhỏ gọn nhưng đầy đủ tiện nghi là điều cần thiết. Chung cư mini 2 phòng ngủ đang trở thành lựa chọn hàng đầu của nhiều bạn trẻ và gia đình nhỏ.</p>
            
            <h3>1. Tối ưu hóa không gian</h3>
            <p>Với diện tích hạn chế, việc tối ưu hóa không gian là yếu tố then chốt. Bạn nên sử dụng các đồ nội thất đa năng như giường có ngăn kéo, bàn gấp, kệ treo tường để tiết kiệm diện tích sàn.</p>
            
            <h3>2. Chọn màu sắc phù hợp</h3>
            <p>Màu sáng như trắng, be, xám nhạt sẽ giúp không gian trông rộng rãi hơn. Bạn có thể điểm xuyết bằng các màu sắc nổi bật ở những chi tiết nhỏ như gối, tranh treo tường.</p>
            
            <h3>3. Ánh sáng tự nhiên</h3>
            <p>Tận dụng tối đa ánh sáng tự nhiên bằng cách sử dụng rèm mỏng, gương lớn để phản chiếu ánh sáng và tạo cảm giác không gian mở.</p>
            
            <h3>4. Phân chia không gian hợp lý</h3>
            <p>Sử dụng kệ sách, vách ngăn nhẹ hoặc rèm để phân chia các khu vực chức năng mà không làm mất đi sự thông thoáng của căn hộ.</p>
            
            <h3>5. Lựa chọn nội thất thông minh</h3>
            <p>Đầu tư vào những món đồ nội thất chất lượng, thiết kế thông minh sẽ giúp bạn tận dụng tối đa không gian nhỏ hẹp mà vẫn đảm bảo tính thẩm mỹ và tiện nghi.</p>
        `,
        createdAt: new Date('2026-01-12')
    },
    {
        title: '25+ MẪU GIƯỜNG NGỦ HỘC KÉO THÔNG MINH CHO CĂN PHÒNG BẠN',
        desc: 'Sự thật là chúng ta dành hết 1/3 cuộc đời chỉ để ngủ, vì thế việc tạo được một giấc ngủ ngon là một điều đặc biệt quan trọng.',
        image: 'tintuc-5.png',
        slug: '25-mau-giuong-ngu-hoc-keo-thong-minh',
        category: 'noi-that-phong-ngu',
        content: `
            <p>Sự thật là chúng ta dành hết 1/3 cuộc đời chỉ để ngủ, vì thế việc tạo được một giấc ngủ ngon là một điều đặc biệt quan trọng. Giường ngủ có hộc kéo không chỉ giúp bạn có giấc ngủ thoải mái mà còn tận dụng tối đa không gian lưu trữ.</p>
            
            <h3>Ưu điểm của giường hộc kéo</h3>
            <ul>
                <li>Tiết kiệm không gian: Tận dụng phần dưới giường để lưu trữ</li>
                <li>Gọn gàng: Cất giữ chăn, ga, gối, quần áo một cách ngăn nắp</li>
                <li>Đa dạng thiết kế: Phù hợp với mọi phong cách nội thất</li>
                <li>Dễ vệ sinh: Không có khoảng trống dưới giường để bụi bẩn tích tụ</li>
            </ul>
            
            <h3>Các mẫu giường hộc kéo phổ biến</h3>
            <p>Hiện nay trên thị trường có rất nhiều mẫu giường hộc kéo với đa dạng kiểu dáng, màu sắc và chất liệu. Từ giường đơn cho phòng nhỏ đến giường đôi size King cho không gian rộng rãi.</p>
        `,
        createdAt: new Date('2026-01-10')
    },
    {
        title: 'NGẤT NGÂY VỚI TOP 10 MẪU NỘI THẤT CHUNG CƯ 1 PHÒNG NGỦ ĐẸP',
        desc: 'Những căn hộ chung cư mini, có diện tích nhỏ ngày càng trở nên nên ưa chuộng hơn trong cuộc sống hiện đại.',
        image: 'tintuc-4.png',
        slug: 'ngat-ngay-voi-top-10-mau-noi-that-chung-cu-1-phong-ngu-dep',
        category: 'thiet-ke-noi-that',
        content: `
            <p>Những căn hộ chung cư mini, có diện tích nhỏ ngày càng trở nên ưa chuộng hơn trong cuộc sống hiện đại. Với chi phí hợp lý và vị trí thuận tiện, căn hộ 1 phòng ngủ là lựa chọn lý tưởng cho người độc thân hoặc cặp đôi mới cưới.</p>
            
            <h3>Xu hướng thiết kế nội thất chung cư 1 phòng ngủ</h3>
            <p>Phong cách tối giản (Minimalist) đang là xu hướng chủ đạo với đường nét đơn giản, màu sắc trung tính và chất liệu tự nhiên.</p>
            
            <h3>Bí quyết thiết kế không gian nhỏ</h3>
            <ul>
                <li>Sử dụng gương để tạo cảm giác rộng rãi</li>
                <li>Chọn đồ nội thất đa chức năng</li>
                <li>Tận dụng không gian theo chiều dọc</li>
                <li>Sử dụng màu sáng làm tông chủ đạo</li>
            </ul>
        `,
        createdAt: new Date('2026-01-08')
    },
    {
        title: 'BÍ QUYẾT BỐ TRÍ PHÒNG BẾP NHỎ THÔNG MINH VÀ TIỆN NGHI',
        desc: 'Phòng bếp là nơi gắn kết cả gia đình, dù diện tích nhỏ nhưng với cách bố trí thông minh vẫn có thể tạo nên không gian ấm cúng.',
        image: 'tintuc-6.png',
        slug: 'bi-quyet-bo-tri-phong-bep-nho-thong-minh',
        category: 'meo-trang-tri',
        content: `<p>Nội dung chi tiết về bí quyết bố trí phòng bếp nhỏ thông minh và tiện nghi...</p>`,
        createdAt: new Date('2026-01-05')
    },
    {
        title: 'XU HƯỚNG THIẾT KẾ PHÒNG KHÁCH HIỆN ĐẠI 2026',
        desc: 'Phòng khách là không gian chính của ngôi nhà, đại diện cho phong cách sống và cá tính của gia chủ.',
        image: 'tintuc-4.png',
        slug: 'xu-huong-thiet-ke-phong-khach-hien-dai-2026',
        category: 'xu-huong-noi-that',
        content: `<p>Nội dung chi tiết về xu hướng thiết kế phòng khách hiện đại năm 2026...</p>`,
        createdAt: new Date('2026-01-03')
    },
    {
        title: 'TOP 15 MẪU ĐÈN TRANG TRÍ SANG TRỌNG CHO NHÀ BẠN',
        desc: 'Đèn trang trí không chỉ là nguồn sáng mà còn là điểm nhấn quan trọng tạo nên vẻ đẹp cho không gian sống.',
        image: 'tintuc-5.png',
        slug: 'top-15-mau-den-trang-tri-sang-trong',
        category: 'noi-that-phong-khach',
        content: `<p>Nội dung chi tiết về top 15 mẫu đèn trang trí sang trọng cho nhà bạn...</p>`,
        createdAt: new Date('2026-01-01')
    },
];

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Đã kết nối MongoDB:", MONGODB_URI);

        let adminUser = await User.findOne({ roles: 'admin' });
        if (!adminUser) {
            console.log("⚠️ Không tìm thấy admin, tạo admin mới...");
            const bcrypt = require("bcrypt");
            const hashedPassword = await bcrypt.hash("admin123", 10);
            adminUser = await User.create({
                email: "admin@nestora.com",
                phone: "0900000000",
                password: hashedPassword,
                name: "Admin Nestora",
                roles: ["admin"],
                status: "active"
            });
            console.log("✅ Đã tạo admin:", adminUser.email);
        }

        await NewsCategory.deleteMany({});
        await NewsCategory.insertMany(
            DEFAULT_NEWS_CATEGORIES.map((item) => ({
                name: item.name,
                slug: item.slug,
                order: item.order,
                isActive: true,
            }))
        );
        console.log(`✅ Đã seed ${DEFAULT_NEWS_CATEGORIES.length} danh mục tin tức`);

        await News.deleteMany({});
        console.log("🗑️ Đã xóa tất cả bài viết cũ");

        const newsWithAuthor = newsData.map(news => ({
            ...news,
            author: adminUser._id
        }));

        const inserted = await News.insertMany(newsWithAuthor);
        console.log(`✅ Đã seed ${inserted.length} bài viết`);

        mongoose.connection.close();
        console.log("🔌 Đã đóng kết nối");
    } catch (error) {
        console.error("❌ Lỗi:", error);
        process.exit(1);
    }
}

run();
