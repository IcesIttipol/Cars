const {
    GLOBAL_SALT
} = process.env
const md5 = require('md5')
const ev = require("express-validator");
//const jwt = require('jsonwebtoken');


class Authen {

    static JWT(req, res, next) {
        try {
            //SKIP JWT

            next()

        } catch (e) {
            return res.status(500).send("Internal Server Error!");
        }
    };


    static checkToken(req, res, next) {
        try {
            if (!req.headers || !req.headers.authorization) return res.status(403).send("Unauthorized (1)");

            let auth = req.headers.authorization.split(':')

            if (auth[0] != "Token" || auth[1] === undefined) return res.status(403).send("Unauthorized (2)");

            let time = req.query.time || req.body.time
            if (!time || isNaN(time)) return res.status(403).send("Unauthorized (3)");
            if (auth[1] != md5(GLOBAL_SALT + time)) return res.status(403).send("Unauthorized (4)");

            let errors = ev.validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 400,
                    data: errors.mapped(),
                });
            }
            next()

        } catch (e) {
            return res.status(500).send("Internal Server Error!");

        };
    };

}

module.exports = Authen