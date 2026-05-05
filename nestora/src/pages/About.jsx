import { Link } from 'react-router-dom';

// Image paths từ public folder
const bannerGioiThieuImg = '/images/AnhCat/banner-gioi-thieu.png';
const thanhLapImg = '/images/AnhCat/thanh-lap.png';
const tamNhinImg = '/images/AnhCat/gioi-thieu-tam-nhin.png';
const voiXaHoiImg = '/images/AnhCat/voi-xa-hoi.png';
const voiNhanVienImg = '/images/AnhCat/voi-nhan-vien.jpg';
const voiDoiTacImg = '/images/AnhCat/voi-doi-tac.jpg';
const voiThiTruongImg = '/images/AnhCat/voi-thi-truong.png';

// Dữ liệu sứ mệnh
const missions = [
    {
        id: 1,
        title: 'Với xã hội',
        desc: 'Hài hòa lợi ích doanh nghiệp với lợi ích xã hội, tích cực cùng cộng đồng xây dựng môi trường sống bền vững.',
        image: voiXaHoiImg
    },
    {
        id: 2,
        title: 'Với nhân viên',
        desc: 'Xây dựng môi trường làm việc chuyên nghiệp, năng động, sáng tạo và nhân văn.',
        image: voiNhanVienImg
    },
    {
        id: 3,
        title: 'Với đối tác',
        desc: 'Xây dựng môi trường làm việc chuyên nghiệp, năng động, sáng tạo và nhân văn.',
        image: voiDoiTacImg
    },
    {
        id: 4,
        title: 'Với thị trường',
        desc: 'Cung cấp các sản phẩm với chất lượng quốc tế và phù hợp với con người Việt Nam.',
        image: voiThiTruongImg
    },
];

const AboutPage = () => {
    return (
        <div className="wrap">
            {/* BANNER */}
            <div className="banner-abt-wrap">
                <div className="img">
                    <img src={bannerGioiThieuImg} alt="Giới thiệu về Nestora" className="w-full" />
                </div>
                <div className="banner-content">
                    <h1 className="text-center">Giới thiệu</h1>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container mx-auto px-4">
                <div className="introduce">
                    {/* Thành lập & Phát triển */}
                    <div className="introduce-box">
                        <h2 className="header-introduce">Thành lập &amp; phát triển</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="img mb-4">
                                <img
                                    src={thanhLapImg}
                                    alt="Thành lập & phát triển"
                                    className="w-full rounded-lg"
                                />
                            </div>
                            <div className="content text-justify">
                                <p>
                                    Nội Thất Nestora được xây dựng dựa trên tình yêu, đam mê của tôi đối với nghề mộc
                                    và khao khát mang những sản phẩm nội thất đẹp của mình đến với khách hàng thân yêu.
                                </p>
                                <p>
                                    Cả 1 quá trình từ 1 người thợ phụ rồi được làm thợ mộc chính, tự tạo ra cho mình
                                    1 phân xưởng nhỏ dần phát triển và hiện tại Nestora đã là 1 trong những công ty
                                    có dịch vụ thiết kế và thi công nội thất uy tín chất lượng với giá tốt nhất tại
                                    Hà Nội với sứ mệnh "đem đến cho khách hàng không gian nội thất hoàn hảo".
                                </p>
                                <p>
                                    Nestora luôn nỗ lực để tạo ra không gian đẹp cho khách hàng theo nhiều gam màu sắc
                                    khác nhau và phong cách đa dạng, theo đúng sở thích, lứa tuổi và phong thủy của khách hàng.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tầm nhìn */}
                    <div className="view-box px-0 md:px-4">
                        <h2 className="header-view">Tầm nhìn</h2>
                        <div className="img">
                            <img
                                src={tamNhinImg}
                                alt="Tầm nhìn"
                                className="w-full rounded-lg"
                            />
                        </div>
                        <div className="content text-justify mt-4">
                            <p>
                                Chúng tôi luôn hướng đến việc tạo ra các sản phẩm nội thất trên triết lý tôn trọng
                                và giữ gìn những gì tự nhiên đã ban tặng cho con người. Chúng tôi luôn tìm tòi và
                                ứng dụng các giải pháp sản phẩm và công nghệ tiên tiến nhất, hợp tác với các đối tác
                                công nghệ hàng đầu thế giới, tìm kiếm và phát triển các vùng nguyên liệu tự nhiên
                                được thiên nhiên chọn lọc, ưu đãi trong nước lẫn nước ngoài, tất cả nhằm tạo ra
                                các sản phẩm nội thất tự nhiên gần gũi cho người khách hàng Việt Nam.
                            </p>
                        </div>
                    </div>

                    {/* Sứ mệnh */}
                    <div className="duty-box">
                        <h2 className="header-duty">Sứ mệnh</h2>
                        <div className="reason grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {missions.map((mission) => (
                                <div key={mission.id} className="reason-item flex">
                                    <div className="img">
                                        <img src={mission.image} alt={mission.title} />
                                    </div>
                                    <div className="content">
                                        <h3 className="title">{mission.title}</h3>
                                        <p className="desc">{mission.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
