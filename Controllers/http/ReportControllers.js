const poolCtrlDB = require("../../Database/ctrlDB");
const Common = require("../../Libraries/Common");

class ReportControllers {
    static Orders = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                car_id,
                model_id,
                staff_id,
                start_dt,
                end_dt
            } = req.body;

            conn = await poolCtrlDB.getConnection();
            if ((car_id && isNaN(car_id)) || (model_id && isNaN(model_id)) || (staff_id && isNaN(staff_id))) {
                data = {
                    status: 400,
                    data: [],
                    message: "Invalid params *car_id,model_id,staff_id must be integer"
                }
                return Common.response(conn, res, data);
            }

            if (isNaN(Date.parse(start_dt)) || isNaN(Date.parse(end_dt))) {
                data = {
                    status: 400,
                    data: [],
                    message: "Invalid params *start_dt,end_dt must be datetime"
                }
                return Common.response(conn, res, data);
            }
            sql = `SELECT d.id as car_id,a.staff_id,st.name,d.brand_name,b.model_name ,COUNT(b.model_id) as qty
                        FROM orders a LEFT JOIN staffs st ON a.staff_id = st.id
                        LEFT JOIN order_details b ON a.id = b.order_id 
                        LEFT JOIN car_models c ON b.model_id = c.id 
                        LEFT JOIN cars d ON c.car_id = d.id
                        WHERE a.create_dt BETWEEN ${conn.escape(start_dt)} AND ${conn.escape(end_dt)}
                        ${car_id ? ` AND c.car_id = ${conn.escape(car_id)}` : ``}
                        ${model_id ? ` AND b.model_id = ${conn.escape(model_id)}` : ``} 
                        ${staff_id ? ` AND a.staff_id = ${conn.escape(staff_id)}` : ``}
                        GROUP BY a.staff_id,d.brand_name,b.model_id,b.model_name`
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    message: "Not found any data"
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

module.exports = ReportControllers;