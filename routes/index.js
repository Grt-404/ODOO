const express = require('express');
const router = express.Router();
const isLoggedin = require('../middlewares/isLoggedin');
const userModel = require('../models/user-model');
const productModel = require('../models/product-model'); // Import Product Model
const operationModel = require('../models/operation-model'); // Import Operation Model

// 1. LANDING PAGE
router.get("/", (req, res) => {
    res.render("home");
});

// 2. AUTH ROUTES
router.get("/login", (req, res) => {
    const error = req.flash("error");
    res.render("login", { error });
});

router.get("/register_user", (req, res) => {
    const error = req.flash("error");
    res.render("register", { error });
});

// 3. DASHBOARD ROUTE (Real Data Connection)
router.get('/home', isLoggedin, async (req, res) => {
    try {
        // Fetch KPIs in parallel for speed
        const [
            totalProducts,
            lowStockCount,
            pendingReceipts,
            pendingDeliveries,
            recentOps
        ] = await Promise.all([
            // Count total products
            productModel.countDocuments(),
            // Count items with less than 10 stock
            productModel.countDocuments({ stock: { $lt: 10 } }),
            // Count Draft Receipts (Incoming)
            operationModel.countDocuments({ type: 'Receipt', status: 'Draft' }),
            // Count Draft Deliveries (Outgoing)
            operationModel.countDocuments({ type: 'Delivery', status: 'Draft' }),
            // Get 5 most recent operations with product details
            operationModel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('items.product')
        ]);

        // Render 'dashboard.ejs' with the fetched data
        res.render("dashboard", {
            totalProducts,
            lowStockCount,
            pendingReceipts,
            pendingDeliveries,
            recentOps,
            user: req.user, // Pass logged-in user info
            success: req.flash('success'),
            error: req.flash('error')
        });

    } catch (err) {
        console.error("Dashboard Error:", err);
        req.flash("error", "Failed to load dashboard data");
        res.redirect('/');
    }
});

module.exports = router;