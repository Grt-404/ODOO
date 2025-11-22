const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/generateToken');


module.exports.registerUser = async function (req, res) {
    try {

        const { email, fullname, password, LoginID } = req.body;
        let user = await userModel.findOne({ email });
        if (user) {
            req.flash("error", "You already have an account, please login");
            return res.redirect("/");

        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const createdUser = await userModel.create({
            email,
            password: hash,
            fullname,
            LoginID
        });

        const token = generateToken(createdUser);
        res.cookie("token", token);
        res.status(201).redirect('/home');

    } catch (err) {
        console.error(err.message);
        req.flash("error", "Server Error");
        return res.redirect("/");

    }
};
module.exports.loginUser = async function (req, res) {
    let { LoginID, password } = req.body;
    let user = await userModel.findOne({ LoginID });
    if (!user) {
        req.flash("error", "LoginID is incorrect");
        return res.redirect("/");

    }
    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = generateToken(user);
            res.cookie("token", token);
            res.redirect('/home');
        }
        else {

            req.flash("error", "LoginID or password is incorrect");
            return res.redirect("/");


        }
    })
}
module.exports.logout = async function (req, res) {
    res.cookie("token", "");
    res.redirect('/')
}
