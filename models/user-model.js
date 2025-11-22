const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullname: String,
    email: String,
    password: {
        type: String,
        required: true
    },
    contact: Number,
    image: {
        type: String,
        default: ""
    },
    // NEW: User Activity Stats
    stats: {
        operationsCount: { type: Number, default: 0 },
        lastLogin: { type: Date, default: Date.now }
    },
    // NEW: Notifications Array
    notifications: [
        {
            message: String,
            type: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
            date: { type: Date, default: Date.now },
            read: { type: Boolean, default: false }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("user", userSchema);