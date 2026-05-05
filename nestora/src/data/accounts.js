// ===== STATIC ACCOUNTS DATA =====
// Dữ liệu tĩnh cho tài khoản Admin và User

export const accounts = [
    // ===== ADMIN ACCOUNTS =====
    {
        id: 1,
        email: 'admin@nestora.vn',
        password: 'Admin@123',
        name: 'Admin Nestora',
        phone: '0901234567',
        role: 'admin',
        status: 'active',
        avatar: '/images/avatar-admin.jpg',
        address: 'Văn phòng Nestora, Quận 1, TP.HCM',
        createdAt: '2025-01-01',
        permissions: ['dashboard', 'products', 'orders', 'users', 'settings']
    },
    {
        id: 2,
        email: 'manager@nestora.vn',
        password: 'Manager@123',
        name: 'Quản lý Nestora',
        phone: '0902345678',
        role: 'admin',
        status: 'active',
        avatar: null,
        address: 'Văn phòng Nestora, Quận 3, TP.HCM',
        createdAt: '2025-02-15',
        permissions: ['dashboard', 'products', 'orders']
    },

    // ===== USER ACCOUNTS =====
    {
        id: 3,
        email: 'nguyenvana@gmail.com',
        password: 'User@123',
        name: 'Nguyễn Văn A',
        phone: '0987654321',
        role: 'user',
        status: 'active',
        avatar: null,
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        createdAt: '2025-06-15',
        orders: 5,
        totalSpent: 75000000
    },
    {
        id: 4,
        email: 'tranthib@gmail.com',
        password: 'User@123',
        name: 'Trần Thị B',
        phone: '0912345678',
        role: 'user',
        status: 'active',
        avatar: null,
        address: '456 Lê Lợi, Quận 3, TP.HCM',
        createdAt: '2025-07-20',
        orders: 3,
        totalSpent: 45000000
    },
    {
        id: 5,
        email: 'levanc@gmail.com',
        password: 'User@123',
        name: 'Lê Văn C',
        phone: '0976543210',
        role: 'user',
        status: 'blocked',
        avatar: null,
        address: '789 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
        createdAt: '2025-08-10',
        orders: 1,
        totalSpent: 15000000
    },
    {
        id: 6,
        email: 'phamthid@gmail.com',
        password: 'User@123',
        name: 'Phạm Thị D',
        phone: '0965432109',
        role: 'user',
        status: 'active',
        avatar: null,
        address: '321 Võ Văn Tần, Quận 3, TP.HCM',
        createdAt: '2025-05-05',
        orders: 8,
        totalSpent: 120000000
    },
    {
        id: 7,
        email: 'hoangvane@gmail.com',
        password: 'User@123',
        name: 'Hoàng Văn E',
        phone: '0954321098',
        role: 'user',
        status: 'active',
        avatar: null,
        address: '654 Cách Mạng Tháng 8, Quận 10, TP.HCM',
        createdAt: '2025-09-25',
        orders: 2,
        totalSpent: 30000000
    }
];

// ===== HELPER FUNCTIONS =====

/**
 * Tìm tài khoản theo email
 */
export const findAccountByEmail = (email) => {
    return accounts.find(account => account.email.toLowerCase() === email.toLowerCase());
};

/**
 * Xác thực đăng nhập
 */
export const authenticateUser = (email, password) => {
    const account = findAccountByEmail(email);

    if (!account) {
        return { success: false, message: 'Email không tồn tại' };
    }

    if (account.password !== password) {
        return { success: false, message: 'Mật khẩu không chính xác' };
    }

    if (account.status === 'blocked') {
        return { success: false, message: 'Tài khoản đã bị khóa' };
    }

    // Trả về thông tin user (không bao gồm password)
    const { password: _, ...userWithoutPassword } = account;
    return { success: true, user: userWithoutPassword };
};

/**
 * Kiểm tra quyền admin
 */
export const isAdmin = (user) => {
    return user && user.role === 'admin';
};

/**
 * Lấy danh sách tất cả users (không phải admin)
 */
export const getAllUsers = () => {
    return accounts
        .filter(account => account.role === 'user')
        .map(({ password, ...user }) => user);
};

/**
 * Lấy danh sách tất cả admins
 */
export const getAllAdmins = () => {
    return accounts
        .filter(account => account.role === 'admin')
        .map(({ password, ...admin }) => admin);
};

// ===== QUICK REFERENCE =====
/*
╔══════════════════════════════════════════════════════════════════╗
║                    THÔNG TIN ĐĂNG NHẬP                          ║
╠══════════════════════════════════════════════════════════════════╣
║  ADMIN:                                                          ║
║  ├─ Email: admin@nestora.vn                                      ║
║  └─ Password: Admin@123                                          ║
║                                                                  ║
║  MANAGER:                                                        ║
║  ├─ Email: manager@nestora.vn                                    ║
║  └─ Password: Manager@123                                        ║
║                                                                  ║
║  USER:                                                           ║
║  ├─ Email: nguyenvana@gmail.com                                  ║
║  └─ Password: User@123                                           ║
╚══════════════════════════════════════════════════════════════════╝
*/

export default accounts;
