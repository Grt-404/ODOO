const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
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
    try {
        let { LoginID, password } = req.body;

        // 1. Find User
        let user = await userModel.findOne({ LoginID });
        if (!user) {
            req.flash("error", "LoginID is incorrect");
            return res.redirect("/");
        }

        // 2. Compare Password (Using await instead of callback)
        const result = await bcrypt.compare(password, user.password);

        if (result) {
            // 3. Generate Token
            let token = generateToken(user);
            res.cookie("token", token);

            // 4. Push Notification & SAVE
            user.notifications.push({
                message: "Welcome back to StockMaster! Dashboard loaded.",
                type: "success",
                date: new Date()
            });

            await user.save(); // <--- CRITICAL FIX

            res.redirect('/home');
        } else {
            req.flash("error", "LoginID or password is incorrect");
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err.message);
        req.flash("error", "Login failed");
        res.redirect("/");
    }
};

module.exports.logout = async function (req, res) {
    res.cookie("token", "");
    res.redirect('/');
};

module.exports.forgotPassword = async function (req, res) {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            req.flash("error", "User with this email does not exist.");
            return res.redirect("/forgot-password");
        }

        const secret = process.env.EXPRESS_SESSION_SECRET + user.password;
        const token = jwt.sign({ email: user.email, id: user._id }, secret, { expiresIn: "15m" });
        const link = `http://localhost:3000/reset-password/${user._id}/${token}`;

        await sendEmail(email, "Password Reset - StockMaster", `Click this link to reset your password: ${link}`);

        req.flash("success", "Password reset link sent to your email.");
        res.redirect("/login");

    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong.");
        res.redirect("/forgot-password");
    }
};

module.exports.resetPasswordGet = async function (req, res) {
    const { id, token } = req.params;
    const user = await userModel.findById(id);

    if (!user) {
        req.flash("error", "Invalid link.");
        return res.redirect("/login");
    }

    try {
        const secret = process.env.EXPRESS_SESSION_SECRET + user.password;
        jwt.verify(token, secret);
        res.render("reset-password", { email: user.email, id, token });
    } catch (err) {
        req.flash("error", "Link expired or invalid.");
        res.redirect("/login");
    }
};
module.exports.updatePassword = async function (req, res) {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            req.flash("error", "New passwords do not match.");
            return res.redirect("/profile/security");
        }

        const user = await userModel.findOne({ email: req.user.email });

        // Check if current password matches
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            req.flash("error", "Incorrect current password.");
            return res.redirect("/profile/security");
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        user.password = hash;
        await user.save();

        req.flash("success", "Password updated successfully.");
        res.redirect("/profile/security");

    } catch (err) {
        console.log(err);
        req.flash("error", "Server Error");
        res.redirect("/profile/security");
    }
};
module.exports.resetPasswordPost = async function (req, res) {
    const { id, token } = req.params;
    const { password } = req.body;

    const user = await userModel.findById(id);
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/login");
    }

    try {
        const secret = process.env.EXPRESS_SESSION_SECRET + user.password;
        jwt.verify(token, secret);

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        user.password = hash;
        await user.save();

        req.flash("success", "Password reset successful! Please login.");
        res.redirect("/login");
    } catch (err) {
        req.flash("error", "Something went wrong.");
        res.redirect("/login");
    }
};