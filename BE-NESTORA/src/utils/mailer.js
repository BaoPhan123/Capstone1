const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_APP_PASS
        }
    });
};

const sendOTP = async (email, otp) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Nestora Customer Service" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Mã Xác Nhận Đăng Ký Tài Khoản Nestora',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .header {
                    background-color: #2c2e53;
                    padding: 30px 20px;
                    text-align: center;
                }
                .logo-text {
                    color: #ffffff;
                    font-size: 28px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    margin: 0;
                }
                .logo-icon {
                    color: #bd945f;
                }
                .content {
                    padding: 40px 30px;
                    color: #334155;
                    line-height: 1.6;
                }
                .title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .message {
                    font-size: 15px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .otp-container {
                    background-color: #f1f5f9;
                    border: 1px dashed #cbd5e1;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .otp-code {
                    font-size: 36px;
                    font-weight: 800;
                    letter-spacing: 8px;
                    color: #bd945f;
                    margin: 0;
                }
                .warning {
                    font-size: 13px;
                    color: #64748b;
                    text-align: center;
                    margin-top: 10px;
                }
                .footer {
                    background-color: #f8fafc;
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                    font-size: 12px;
                    color: #94a3b8;
                }
                .divider {
                    height: 1px;
                    background-color: #e2e8f0;
                    margin: 30px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="logo-text"><span class="logo-icon">N</span>estora</h1>
                </div>
                <div class="content">
                    <div class="title">Xác thực địa chỉ Email của bạn</div>
                    <div class="message">
                        Cảm ơn bạn đã đăng ký tài khoản tại Nestora. Để hoàn tất thủ tục đăng ký và bảo mật tài khoản, vui lòng sử dụng mã xác thực (OTP) dưới đây:
                    </div>
                    
                    <div class="otp-container">
                        <div class="otp-code">${otp}</div>
                    </div>
                    
                    <div class="warning">
                        Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>.<br>
                        Vui lòng không chia sẻ mã này cho bất kỳ ai để đảm bảo an toàn cho tài khoản.
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div style="font-size: 14px; text-align: center; color: #64748b;">
                        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Nestora. Nâng tầm không gian sống.<br>
                    Website: https://nestora.vn
                </div>
            </div>
        </body>
        </html>
        `
    };

    return transporter.sendMail(mailOptions);
};

const sendDiscountCode = async (email, code, customerName = "bạn") => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Nestora Customer Service" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Mã giảm giá 5% cho đơn hàng tiếp theo tại Nestora",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; background:#f8fafc; margin:0; padding:0; color:#334155; }
                .container { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,.08); }
                .header { background:#2c2e53; padding:28px 20px; text-align:center; }
                .logo { color:#fff; font-size:28px; font-weight:800; margin:0; }
                .logo span { color:#bd945f; }
                .content { padding:36px 30px; text-align:center; line-height:1.6; }
                .title { font-size:20px; font-weight:700; color:#0f172a; margin-bottom:12px; }
                .code { display:inline-block; margin:22px 0; padding:16px 24px; border:2px dashed #bd945f; border-radius:8px; color:#bd945f; font-size:28px; font-weight:800; letter-spacing:2px; background:#fbf7f1; }
                .note { color:#64748b; font-size:14px; }
                .footer { background:#f8fafc; padding:18px; text-align:center; font-size:12px; color:#94a3b8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1 class="logo"><span>N</span>estora</h1></div>
                <div class="content">
                    <div class="title">Cảm ơn ${customerName} đã mua hàng tại Nestora</div>
                    <p>Nestora gửi bạn mã giảm giá <strong>5%</strong> cho lần mua hàng tiếp theo:</p>
                    <div class="code">${code}</div>
                    <p class="note">Nhập mã này ở trang thanh toán để được giảm 5% giá trị đơn hàng.</p>
                </div>
                <div class="footer">&copy; ${new Date().getFullYear()} Nestora. Nâng tầm không gian sống.</div>
            </div>
        </body>
        </html>`
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendOTP,
    sendDiscountCode
};
