const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { sendOTP } = require("../utils/mailer");

exports.register = async (req, res) => {
    try {
        const { email, phone, password, name, address } = req.body;

        let user = await User.findOne({ $or: [{ email }, { phone }] });
        if (user && user.isVerified !== false) {
            return res.status(400).json({ message: "Mail hoặc số điện thoại đã tồn tại" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        const hashedPw = await bcrypt.hash(password, 10);

        if (user) {
            // Overwrite existing unverified user
            user.password = hashedPw;
            user.name = name;
            if (address !== undefined) {
                user.address = address;
            }
            user.otp = hashedOtp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            user = await User.create({
                email,
                phone,
                password: hashedPw,
                name,
                address,
                roles: ["customer"],
                isVerified: false,
                otp: hashedOtp,
                otpExpires
            });
        }

        try {
            await sendOTP(email, otp);
        } catch (mailErr) {
            console.error("Lỗi gửi mail:", mailErr);
        }

        res.json({
            message: "Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP.",
            requires_verification: true,
            email: user.email
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

        if (user.isVerified !== false) {
            return res.status(400).json({ message: "Tài khoản đã được xác thực" });
        }

        if (!user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: "Mã OTP đã hết hạn" });
        }

        const isValid = await bcrypt.compare(otp, user.otp);
        if (!isValid) return res.status(400).json({ message: "Mã OTP không hợp lệ" });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: "Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

        if (user.isVerified !== false) {
            return res.status(400).json({ message: "Tài khoản đã được xác thực" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        try {
            await sendOTP(email, otp);
        } catch (mailErr) {
            console.error("Lỗi gửi mail:", mailErr);
        }

        res.json({ message: "Đã gửi lại mã OTP. Vui lòng kiểm tra email." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        const user = await User.findOne(email ? { email } : { phone });
        if (!user) return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ" });

        if (user.isVerified === false) {
            return res.status(403).json({
                message: "Tài khoản chưa được xác thực. Vui lòng xác thực email.",
                requires_verification: true,
                email: user.email
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ" });

        const payload = { id: user._id, email: user.email, phone: user.phone, roles: user.roles };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken({ sid: crypto.randomUUID(), ...payload });

        res.json({
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user._id,
                email: user.email,
                phone: user.phone,
                roles: user.roles,
                name: user.name,
                avatar: user.avatar,
                address: user.address
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.refresh = async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) return res.status(400).json({ message: "Thiếu refresh_token" });

        const decoded = verifyRefreshToken(refresh_token);

        const payload = { id: decoded.id, email: decoded.email, phone: decoded.phone, roles: decoded.roles };
        const newAccess = signAccessToken(payload);
        const newRefresh = signRefreshToken({ sid: crypto.randomUUID(), ...payload });

        res.json({ access_token: newAccess, refresh_token: newRefresh });
    } catch (err) {
        res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }
};

exports.logout = async (req, res) => {
    try {
        res.json({ message: "Đăng xuất thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMe = async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
};

exports.adminOnly = async (req, res) => {
    res.json({ message: "Welcome Admin!", user: req.user });
};
