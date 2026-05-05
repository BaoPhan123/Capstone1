const crypto = require("crypto");

const config = {
    app_id: process.env.ZALO_APP_ID ? Number(process.env.ZALO_APP_ID) : 2553,
    key1: process.env.ZALO_KEY1 || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
    key2: process.env.ZALO_KEY2 || 'kLtgPl8HHhfvMuDHPwKfgfsY4Yd2uI1n',
    create_order_endpoint: "https://sb-openapi.zalopay.vn/v2/create",
    query_order_endpoint: "https://sb-openapi.zalopay.vn/v2/query",
    base_url: process.env.ZALO_BASE_URL || null
};

function computeMac(data, key) {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
}

module.exports = { config, computeMac };
