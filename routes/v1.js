const route = require('express').Router();
const Authen = require('../Middleware/Authen');
const ex = require("express-validator");

//cars
const Cars = require('../Controllers/http/CarsControllers');
route.post('/car/create', [
    ex.body("brand_name").notEmpty(),
    ex.body("models").notEmpty().isArray(),
    ex.body("staff_id").notEmpty().isNumeric(),
    ex.body("description").notEmpty(),
], Authen.checkToken, Cars.CreateCar);

route.post('/car/update', [
    ex.body("car_id").notEmpty().isNumeric(),
    ex.body("models").notEmpty().isArray(),
    ex.body("staff_id").notEmpty().isNumeric(),
], Authen.checkToken, Cars.UpdateCar);

route.post('/car/models/add', [
    ex.body("car_id").notEmpty().isNumeric(),
    ex.body("models").notEmpty().isArray(),
    ex.body("staff_id").notEmpty().isNumeric(),
], Authen.checkToken, Cars.AddModel);


//orders
const Orders = require('../Controllers/http/OrdersControllers');
route.post('/order/create', [
    ex.body("modelid_list").notEmpty().isArray(),
    ex.body("staff_id").notEmpty().isNumeric(),
], Authen.checkToken, Orders.CreateOrder);




//report
const Report = require('../Controllers/http/ReportControllers');
route.post('/report/orders', Authen.checkToken, Report.Orders);

module.exports = route