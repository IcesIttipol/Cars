const poolCtrlDB = require("../../Database/ctrlDB");
const Common = require("../../Libraries/Common");

class OrdersControllers {
    static CreateOrder = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                car_id,
                modelid_list,
                remark,
                staff_id,
            } = req.body;

            conn = await poolCtrlDB.getConnection();
            try {
                sql = `SELECT * FROM staffs WHERE id = ${conn.escape(staff_id)}`;
                let checkStaff = await Common.handleQuery(conn.query(sql));
                if (checkStaff?.data.length == 0) {
                    data = {
                        status: 404,
                        data: [],
                        message: "Cannot found staff id"
                    }

                    return Common.response(conn, res, data);
                } else if (!checkStaff.status) {
                    throw resp.data
                }

                let order_id;
                let i = 0;
                let dt = new Date();
                let prefix = `${dt.getFullYear()}${dt.getDate()}`;
                let order_number = (prefix + Common.ranStr(6)).toUpperCase();
                do {
                    i++;
                    sql = `SELECT * FROM orders WHERE order_number = ${conn.escape(order_number)}`;
                    resp = await Common.handleQuery(conn.query(sql));
                    if (!resp.status) {
                        throw resp.data
                    } else if (resp?.data.length > 0) {
                        order_number = (prefix + Common.ranStr(6)).toUpperCase();
                        continue;
                    }

                    await conn.query('START TRANSACTION');

                    sql = `INSERT INTO orders SET 
                        ${remark ? `remark = ${conn.escape(remark)},` : ``}
                        order_number = ${conn.escape(order_number)},
                        staff_id = ${conn.escape(staff_id)}`;
                    resp = await Common.handleQuery(conn.query(sql));
                    if (!resp.status) {
                        throw resp.data
                    }
                    order_id = resp.data.insertId;

                    for (let row of modelid_list) {
                        sql = `SELECT a.id as model_id , a.model_name , b.id as car_id , b.brand_name 
                                FROM car_models a JOIN cars b ON a.car_id = b.id 
                                WHERE a.id = ${conn.escape(row)}`;
                        resp = await Common.handleQuery(conn.query(sql));
                        if (!resp.status) {
                            throw resp.data
                        } else if (resp?.data.length == 0) {
                            data = {
                                status: 500,
                                data: [],
                                message: `model id ${row} is not exist.`
                            }
                            return Common.response(conn, res, data);
                        }

                        sql = `INSERT INTO order_details SET 
                                order_id = ${order_id},
                                model_id = ${resp.data[0].model_id},
                                brand_name = ${conn.escape(resp.data[0].brand_name)},
                                model_name = ${conn.escape(resp.data[0].model_name)}`
                        resp = await Common.handleQuery(conn.query(sql));
                        if (!resp.status) {
                            throw resp.data
                        }
                    }
                    break;
                } while (i <= 3)

                if (i >= 3) {
                    data = {
                        status: 500,
                        data: [],
                        message: `Cannot generate order number`
                    }

                    return Common.response(conn, res, data);
                }

                await conn.query('COMMIT');

                sql = `SELECT a.staff_id, a.order_number, a.create_dt, a.remark, b.brand_name , b.model_name
                        FROM orders a JOIN order_details b ON a.id = b.order_id
                        WHERE a.id = ${order_id}`;
                resp = await Common.handleQuery(conn.query(sql));
                if (!resp.status) {
                    throw resp.data
                } else if (resp?.data.length == 0) {
                    data = {
                        status: 500,
                        data: [],
                        message: `CANNOT CREATE ORDER`
                    }

                    return Common.response(conn, res, data);
                }
                data = {
                    status: 200,
                    data: resp.data,
                    msg: "success"
                };

                return Common.response(conn, res, data);

            } catch (e) {
                await conn.query('ROLLBACK');
                if (conn) conn.release();
                throw e
            };

        } catch (e) {
            console.log(e);
            data = {
                status: 500,
                data: e?.stack ? e.stack : e,
                message: "Fails"
            };
            return Common.response(conn, res, data);
        };
    };

};

module.exports = OrdersControllers;