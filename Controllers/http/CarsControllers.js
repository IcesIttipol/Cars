const poolCtrlDB = require("../../Database/ctrlDB");
const Common = require("../../Libraries/Common");

class CarsControllers {
    static CreateCar = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                brand_name,
                description,
                models,
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


                let car_id;
                sql = `SELECT * FROM cars WHERE brand_name = ${conn.escape(brand_name)} LIMIT 1`;
                resp = await Common.handleQuery(conn.query(sql));
                if (resp?.data.length > 0) {
                    data = {
                        status: 400,
                        data: [],
                        message: `Brand name : ${brand_name} already exist.`
                    }

                    return Common.response(conn, res, data);
                } else if (!resp.status) {
                    throw resp.data
                }

                sql = `INSERT INTO cars SET 
                        brand_name = ${conn.escape(brand_name)},
                        description = ${conn.escape(description)}`;
                resp = await Common.handleQuery(conn.query(sql));
                if (!resp.status) {
                    throw resp.data
                }

                car_id = resp.data.insertId;

                await conn.query('START TRANSACTION');
                for (let row of models) {
                    sql = `INSERT INTO car_models SET 
                            car_id = ${car_id},
                            model_name = ${conn.escape(row)},
                            create_by_staff_id = ${conn.escape(staff_id)}`;
                    resp = await Common.handleQuery(conn.query(sql));
                    if (!resp.status) {
                        throw resp.data
                    }
                }
                await conn.query('COMMIT');

                sql = `SELECT a.id as car_id , a.brand_name , b.create_by_staff_id , b.id as model_id,b.model_name 
                        FROM cars a JOIN car_models b ON a.id = b.car_id 
                        WHERE a.id = ${car_id}`;
                resp = await Common.handleQuery(conn.query(sql));
                if (!resp.status) {
                    throw resp.data
                } else if (resp?.data.length == 0) {
                    data = {
                        status: 500,
                        data: [],
                        message: `CANNOT CREATE CAR`
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

    static UpdateCar = async (req, res) => {
        let data, conn, sql, resp, output = [];
        try {
            const {
                car_id,
                description,
                brand_name,
                models,
                staff_id
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

                sql = `SELECT * FROM cars WHERE id = ${conn.escape(car_id)}`;
                let checkCars = await Common.handleQuery(conn.query(sql));
                if (checkCars?.data.length == 0) {
                    data = {
                        status: 404,
                        data: [],
                        message: "Cannot found car id"
                    }

                    return Common.response(conn, res, data);
                } else if (!checkCars.status) {
                    throw resp.data
                }

                await conn.query('START TRANSACTION');

                if (description || brand_name) {
                    sql = `UPDATE cars SET 
                        ${description ? `description = ${conn.escape(description)},` : ``}
                        ${brand_name ? `brand_name = ${conn.escape(brand_name)},` : ``}
                        update_dt = now()
                        WHERE id = ${car_id}`;
                    resp = await Common.handleQuery(conn.query(sql));
                    if (!resp.status) {
                        throw resp.data
                    }
                }

                let arr = [];
                let model_list = [];
                for (let model of models) {
                    if (model?.id) {
                        sql = `SELECT * FROM car_models WHERE id = ${model.id} AND car_id = ${car_id}`;
                        resp = await Common.handleQuery(conn.query(sql));
                        if (resp?.data.length == 0) {
                            data = {
                                status: 404,
                                data: [],
                                message: `Not found model id : ${model.id}`
                            }
                            return Common.response(conn, res, data);
                        } else if (!resp.status) {
                            throw resp.data
                        }

                        sql = `UPDATE car_models SET 
                        ${model?.model_name ? `model_name = ${conn.escape(model.model_name)},` : ``}
                        update_by_staff_id = ${conn.escape(staff_id)},
                        update_dt = now()
                        WHERE id = ${model.id} AND car_id = ${car_id}`;
                        arr.push(Common.handleQuery(conn.query(sql)));
                        model_list.push(model.id);
                    }
                }

                await Promise.all(arr);
                await conn.query('COMMIT');
                sql = `SELECT a.id as car_id , a.brand_name, a.description , b.update_by_staff_id , b.id as model_id,b.model_name 
                        FROM cars a JOIN car_models b ON a.id = b.car_id 
                        WHERE a.id = ${car_id} AND b.id IN ('${model_list.join("','")}')`;
                resp = await Common.handleQuery(conn.query(sql));
                if (!resp.status) {
                    throw resp.data
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

    static AddModel = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                car_id,
                models,
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

                sql = `SELECT * FROM cars WHERE id = ${conn.escape(car_id)} LIMIT 1`;
                resp = await Common.handleQuery(conn.query(sql));
                if (!resp.status) {
                    throw resp.data
                } else if (resp?.data.length == 0) {
                    data = {
                        status: 400,
                        data: [],
                        message: `car id is not exist.`
                    }

                    return Common.response(conn, res, data);
                }

                sql = `SELECT * FROM car_models WHERE model_name IN ('${models.join("','")}')`;
                resp = await Common.handleQuery(conn.query(sql));
                if (!resp.status) {
                    throw resp.data
                } else if (resp?.data.length > 0) {
                    data = {
                        status: 400,
                        data: [],
                        message: `Duplicate model,Please check your model body.`
                    }

                    return Common.response(conn, res, data);
                }

                await conn.query('START TRANSACTION');
                for (let row of models) {
                    sql = `INSERT INTO car_models SET 
                            car_id = ${car_id},
                            model_name = ${conn.escape(row)},
                            create_by_staff_id = ${conn.escape(staff_id)}`;
                    resp = await Common.handleQuery(conn.query(sql));
                    if (!resp.status) {
                        throw resp.data
                    }
                }
                await conn.query('COMMIT');

                sql = `SELECT a.id as car_id , a.brand_name , b.create_by_staff_id , b.id as model_id,b.model_name 
                        FROM cars a JOIN car_models b ON a.id = b.car_id 
                        WHERE a.id = ${car_id} AND b.model_name IN ('${models.join("','")}')`;
                resp = await Common.handleQuery(conn.query(sql));
                if (!resp.status) {
                    throw resp.data
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

module.exports = CarsControllers;