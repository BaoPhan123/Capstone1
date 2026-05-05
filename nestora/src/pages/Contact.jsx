import { useState } from 'react';

// Image paths từ public folder
const bannerLienHeImg = '/images/AnhCat/banner-lien-he.png';
const lienHeImg1 = '/images/AnhCat/lien-he-img1.png';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        content: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Handle form submission logic here
        alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
        setFormData({
            name: '',
            email: '',
            phone: '',
            content: ''
        });
    };

    return (
        <div className="wrap">
            {/* BANNER */}
            <div className="banner-abt-wrap">
                <div className="img">
                    <img src={bannerLienHeImg} alt="Liên hệ với Nestora" className="w-full" />
                </div>
                <div className="banner-content">
                    <h1 className="text-center">Liên hệ</h1>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container mx-auto px-4">
                <div className="contact-box">
                    <div className="box px-0 md:px-4">
                        <div className="cont-box flex">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                                <div className="hidden lg:block">
                                    <div className="img">
                                        <img
                                            src={lienHeImg1}
                                            alt="Liên hệ"
                                            className="w-full rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="content">
                                        <p className="title lien-he mb-4">Liên hệ với chúng tôi</p>
                                        <form onSubmit={handleSubmit} className="form-group lien-he">
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Họ và tên"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="Email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                            <input
                                                type="tel"
                                                name="phone"
                                                placeholder="Số điện thoại"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                            />
                                            <textarea
                                                name="content"
                                                placeholder="Nội dung"
                                                value={formData.content}
                                                onChange={handleChange}
                                                rows={4}
                                                required
                                            />
                                            <br />
                                            <button type="submit" className="contact-send">
                                                Gửi
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
