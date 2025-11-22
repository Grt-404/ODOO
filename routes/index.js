const authController = require('../controllers/authController');
const express = require('express');
const router = express.Router();
const isLoggedin = require('../middlewares/isLoggedin');
const userModel = require('../models/user-model');
const productModel = require('../models/product-model');
const operationModel = require('../models/operation-model');
const upload = require('../config/multer-config');
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
router.get('/profile', isLoggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        res.render("profile", {
            user,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        req.flash("error", "Something went wrong");
        res.redirect("/home");
    }
});

// POST: Update Profile
router.post('/profile/update', isLoggedin, upload.single('image'), async (req, res) => {
    try {
        // Find user by the email stored in the session/token
        const user = await userModel.findOne({ email: req.user.email });

        // Update text fields
        if (req.body.fullname) user.fullname = req.body.fullname;
        if (req.body.contact) user.contact = req.body.contact;

        // Update Image if a file was uploaded
        if (req.file) {
            // Convert buffer to base64 to store in MongoDB string field
            user.image = req.file.buffer.toString('base64');
        }

        await user.save();

        req.flash("success", "Profile updated successfully");
        res.redirect("/profile");

    } catch (err) {
        console.log(err);
        req.flash("error", "Error updating profile");
        res.redirect("/profile");
    }
});
// --- DASHBOARD ROUTE UPDATED FOR ALERTS ---
// ... inside router.get('/home', ...)

router.get('/home', isLoggedin, async (req, res) => {
    try {
        // Remove the hardcoded line: const THRESHOLD = 10; 

        const [totalProducts, recentOps, allProducts] = await Promise.all([
            productModel.countDocuments(),
            operationModel.find().sort({ createdAt: -1 }).limit(5).populate('items.product'),
            productModel.find().populate('stockByLocation.warehouse')
        ]);

        let pendingReceipts = await operationModel.countDocuments({ type: 'Receipt', status: 'Draft' });
        let pendingDeliveries = await operationModel.countDocuments({ type: 'Delivery', status: 'Draft' });

        let alerts = [];
        let lowStockCount = 0;

        allProducts.forEach(product => {
            // USE DYNAMIC THRESHOLD HERE
            const limit = product.minimumStock || 10;

            // Check Global Stock
            if (product.totalStock <= limit) {
                lowStockCount++;
            }

            // Check Specific Warehouse Stock
            if (product.stockByLocation && product.stockByLocation.length > 0) {
                product.stockByLocation.forEach(loc => {
                    // Alert if a specific warehouse is below the limit
                    if (loc.quantity <= limit && loc.warehouse) {
                        alerts.push({
                            sku: product.sku,
                            name: product.name,
                            warehouse: loc.warehouse.name,
                            quantity: loc.quantity,
                            limit: limit // Pass the limit to the view so user knows why it alerted
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
            alerts,
            user: req.user,
            success: req.flash('success'),
            error: req.flash('error')
        });

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});
router.get('/profile', isLoggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        res.render("profile", {
            user,
            activeTab: 'personal', // Used to highlight sidebar
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        res.redirect("/home");
    }
});

// 2. Notifications Page
router.get('/profile/notifications', isLoggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        // Sort notifications: Newest first
        user.notifications.sort((a, b) => b.date - a.date);

        res.render("notifications", {
            user,
            activeTab: 'notifications',
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        res.redirect("/profile");
    }
});
// Handle Password Update
router.post('/profile/security/update-password', isLoggedin, authController.updatePassword);
// 3. Clear Notifications Logic
router.post('/profile/notifications/clear', isLoggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        user.notifications = []; // Clear all
        await user.save();
        req.flash('success', 'All notifications cleared.');
        res.redirect('/profile/notifications');
    } catch (err) {
        res.redirect('/profile/notifications');
    }
});

// 4. Security Settings Page
router.get('/profile/security', isLoggedin, async (req, res) => {
    const user = await userModel.findOne({ email: req.user.email });
    res.render("security", {
        user,
        activeTab: 'security',
        success: req.flash('success'),
        error: req.flash('error')
    });
});

module.exports = router;