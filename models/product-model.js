const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: String, required: true, trim: true },
    unitOfMeasure: { type: String, required: true, trim: true },

    // NEW: Dynamic Threshold (User sets this)
    minimumStock: {
        type: Number,
        default: 10 // Default fallback if user doesn't set it
    },

    stockByLocation: [{
        warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'warehouse' },
        quantity: { type: Number, default: 0 }
    }],

    totalStock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('product', productSchema);