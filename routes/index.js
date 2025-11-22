const express = require('express');
const router = express.Router();
const isLoggedin = require('../middlewares/isLoggedin');
const userModel = require('../models/user-model');
const productModel = require('../models/product-model');
const operationModel = require('../models/operation-model');

router.get("/", (req, res) => {
    res.render("home");
});

router.get("/login", (req, res) => {
    const error = req.flash("error");
    res.render("login", { error });
});

router.get("/register_user", (req, res) => {
    const error = req.flash("error");
    res.render("register", { error });
});

// --- DASHBOARD ROUTE UPDATED FOR ALERTS ---
router.get('/home', isLoggedin, async (req, res) => {
    try {
        // 1. Define Low Stock Threshold
        const THRESHOLD = 10;

        // 2. Fetch Data in Parallel
        const [totalProducts, recentOps, allProducts] = await Promise.all([
            productModel.countDocuments(),
            operationModel.find().sort({ createdAt: -1 }).limit(5).populate('items.product'),
            // Fetch products to calculate specific location alerts
            productModel.find().populate('stockByLocation.warehouse')
        ]);

        // 3. Calculate Logic for Alerts
        let pendingReceipts = await operationModel.countDocuments({ type: 'Receipt', status: 'Draft' });
        let pendingDeliveries = await operationModel.countDocuments({ type: 'Delivery', status: 'Draft' });

        // Generate Alerts List: Check EVERY location of EVERY product
        let alerts = [];
        let lowStockCount = 0; // Count of unique products that are low (Total stock)

        allProducts.forEach(product => {
            // Check Global Stock
            if (product.totalStock <= THRESHOLD) {
                lowStockCount++;
            }

            // Check Specific Warehouse Stock
            if (product.stockByLocation && product.stockByLocation.length > 0) {
                product.stockByLocation.forEach(loc => {
                    if (loc.quantity <= THRESHOLD && loc.warehouse) {
                        alerts.push({
                            sku: product.sku,
                            name: product.name,
                            warehouse: loc.warehouse.name,
                            quantity: loc.quantity
                        });
                    }
                });
            }
        });

        res.render("dashboard", {
            totalProducts,
            lowStockCount,
            pendingReceipts,
            pendingDeliveries,
            recentOps,
            alerts, // Pass the detailed alerts to the view
            user: req.user,
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