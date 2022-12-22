const alert = require('alert');
const {readUserId} = require("../utils/helpers");

const alertMsg = "No userId given, please input userId to the console...";

const validateUserId = async(req, res, next) => {
    if (!req.params.userId) {
        alert(alertMsg);
        req.params.userId = await readUserId();
    }
    next();
}

module.exports = { validateUserId };