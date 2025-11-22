const express = require('express');
const router = express.Router();
const productModel = require('../models/product-model');
const warehouseModel = require('../models/warehouse-model'); // Import Warehouse Model
const isLoggedIn = require('../middlewares/isLoggedin');

// GET: List Products (Now fetches warehouses too)
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const products = await productModel.find()
            .populate('stockByLocation.warehouse')
            .sort({ createdAt: -1 });

        // Fetch warehouses for the "Create Product" dropdown
        const warehouses = await warehouseModel.find({ type: 'Internal' });

        res.render('products', {
            products,
            warehouses, // Pass warehouses to view
            success: req.flash('success')
        });
    } catch (err) {
        res.send(err.message);
    }
});

// POST: Create Product (Now handles Initial Location)
router.post('/create', isLoggedIn, async (req, res) => {
    try {
        // Get minimumStock from body
        let { name, sku, category, unitOfMeasure, stock, initialWarehouse, minimumStock } = req.body;

        let stockByLocation = [];
        let totalStock = 0;

        if (stock && stock > 0) {
            if (!initialWarehouse) {
                req.flash('success', 'Error: Please select a warehouse for initial stock.');
                return res.redirect('/products');
            }
            stockByLocation.push({
                warehouse: initialWarehouse,
                quantity: Number(stock)
            });
            totalStock = Number(stock);
        }

        await productModel.create({
            name,
            sku,
            category,
            unitOfMeasure,
            minimumStock: Number(minimumStock) || 10, // Save user preference or default to 10
            stockByLocation,
            totalStock
        });

        req.flash('success', 'Product created successfully');
        res.redirect('/products');
    } catch (err) {
        res.send(err.message);
    }
});
// ... (Keep History Route same as before) ...
router.get('/:id/history', isLoggedIn, async (req, res) => {
    const product = await productModel.findById(req.params.id);
    const operations = await require('../models/operation-model').find({ 'items.product': req.params.id }).sort({ createdAt: -1 });
    res.render('product_history', { product, operations });
});

module.exports = router;