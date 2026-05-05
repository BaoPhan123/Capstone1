class ApiRes {
    static send(res, { statusCode, success, message, data = null, errors = null, meta = null }) {
        const response = {
            success,
            message,
            statusCode
        };

        if (data !== null) {
            response.data = data;
        }

        if (errors) {
            response.errors = errors;
        }

        if (meta) {
            response.meta = meta;
        }

        return res.status(statusCode).json(response);
    }
    static success(res, { message = "Thành công", data = null, meta = null, statusCode = 200 }) {
        return this.send(res, { statusCode, success: true, message, data, meta });
    }
}

module.exports = ApiRes;