const {
    GLOBAL_SALT,
} = process.env;
class Common {

    static escape(str) {
        return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\" + char; // prepends a backslash to backslash, percent,
                // and double/single quotes
            }
        });
    }

    static async handleQuery(promise) {
        return promise.then((result) => {
            return {
                status: true,
                data: result[0]
            }
        }).catch((e) => {
            return {
                status: false,
                data: e
            }
        });
    };

    static ranStr(length) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    static response(conn, res, data) {
        if (conn != 0 && !conn?.connection?._pool?._closed) {
            //ในกรณีมีเปิด connection มาก่อน
            conn.query('ROLLBACK');
            conn.release();
            return res.status(data.status).json(data);
        } else {
            return res.status(data.status).json(data);
        }
    };
};

module.exports = Common