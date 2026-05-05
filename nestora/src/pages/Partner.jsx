import { Link } from 'react-router-dom';

// Image paths từ public folder
const bannerDoiTacImg = '/images/AnhCat/banner-doi-tac.png';
const vinpearlImg = '/images/AnhCat/vinpearl.png';
const muongThanhImg = '/images/AnhCat/muong-thanh.png';
const sheratonImg = '/images/AnhCat/sheraton.png';
const tchImg = '/images/AnhCat/the-coffee-house.png';
const marvellaImg = '/images/AnhCat/marvella.png';

// Dữ liệu đối tác
const partners = [
    {
        id: 1,
        name: 'Công ty cổ phần Vinpearl',
        desc: 'Vinpearl là thương hiệu dịch vụ du lịch nghỉ dưỡng – giải trí lớn nhất Việt Nam. Vinpearl sở hữu chuỗi khách sạn, resort và trung tâm hội nghị đẳng cấp 5 sao, các khu vui chơi giải trí quốc tế tọa lạc tại những danh thắng du lịch nổi tiếng nhất của Việt Nam.',
        image: vinpearlImg
    },
    {
        id: 2,
        name: 'Tập đoàn khách sạn Mường Thanh',
        desc: 'Tại Mường Thanh, chúng tôi mời bạn cùng khởi hành chuyến đi tìm về không gian thanh thản chứa đựng những nét văn hóa mang đậm tinh thần bản sắc Việt, nơi con người gắn kết và thân ái gửi trao nhau tình cảm chân thành.',
        image: muongThanhImg
    },
    {
        id: 3,
        name: 'Sheraton Hanoi Hotel',
        desc: 'Situated on the shores of Hanoi\'s West Lake and surrounded by its many local attractions, Sheraton Hanoi Hotel is just a quick drive to the bustling downtown of Hanoi City. Explore the nearby Old Quarter, home to Hoan Kiem Lake, Hanoi Opera House and exceptional boutiques.',
        image: sheratonImg
    },
    {
        id: 4,
        name: 'The Coffee House',
        desc: 'Tại The Coffee House, chúng tôi luôn trân trọng những câu chuyện và đề cao giá trị Kết nối con người. Chúng tôi mong muốn The Coffee House sẽ trở thành "Nhà Cà Phê", nơi mọi người xích lại gần nhau và tìm thấy niềm vui, sự sẻ chia thân tình bên những tách cà phê đượm hương, chất lượng.',
        image: tchImg
    },
    {
        id: 5,
        name: 'Marvella Hotel Nha Trang',
        desc: 'Marvella Hotel Nha Trang là khách sạn 4 sao nằm tại trung tâm thành phố biển Nha Trang, mang đến trải nghiệm nghỉ dưỡng tuyệt vời với tiêu chuẩn dịch vụ quốc tế.',
        image: marvellaImg
    },
];

const PartnerPage = () => {
    return (
        <div className="wrap">
            {/* BANNER */}
            <div className="banner-abt-wrap">
                <div className="img">
                    <img src={bannerDoiTacImg} alt="Đối tác của Nestora" className="w-full" />
                </div>
                <div className="banner-content">
                    <h1 className="text-center">Đối tác</h1>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container mx-auto px-4">
                <div className="introduce partner">
                    {partners.map((partner) => (
                        <div key={partner.id} className="partner-box flex">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-center">
                                <div className="md:col-span-3 lg:col-span-4 flex items-center">
                                    <div className="img w-full px-2 lg:px-8">
                                        <img
                                            src={partner.image}
                                            alt={partner.name}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-9 lg:col-span-8 flex items-center">
                                    <div className="content text-justify">
                                        <h3 className="title">{partner.name}</h3>
                                        <p className="desc">{partner.desc}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PartnerPage;
