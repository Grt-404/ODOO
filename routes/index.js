const express = require('express');
const isLoggedin = require('../middlewares/isLoggedin');
const userModel = require('../models/user-model');
const router = express.Router();

router.get("/", (req, res) => {
    res.render("home");
})
router.get("/login", (req, res) => {
    const error = req.flash("error");
    res.render("login", { error });
})
router.get('/home', isLoggedin, async (req, res) => {
    try {

        res.render("dashboard");
    } catch (err) {
        console.error(err);
        req.flash("error", "Error loading shop");
        res.redirect('/home');
    }
});

module.exports = router;