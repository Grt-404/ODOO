const mongoose = require('mongoose');

const warehouseSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    // HIERARCHY: Is this inside another location?
    parentLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'warehouse',
        default: null
    },
    // Full Path for easy reading (e.g., "Main Warehouse / Row 1")
    path: {
        type: String,
        default: ''
    },
    address: String,
    latitude: Number,
    longitude: Number,
    type: {
        type: String,
        enum: ['Internal', 'Vendor', 'Customer', 'View'],
        default: 'Internal'
    }
}, { timestamps: true });

// --- FIX APPLIED BELOW ---
// 1. Removed 'next' from the function parameters
// 2. Removed 'next()' call at the end
warehouseSchema.pre('save', async function () {
    this.path = this.name;
    if (this.parentLocation) {
        const parent = await this.constructor.findById(this.parentLocation);
        if (parent) {
            this.path = `${parent.path} / ${this.name}`;
        }
    }
    // The async function automatically returns a promise, signaling Mongoose to proceed.
});

module.exports = mongoose.model('warehouse', warehouseSchema);