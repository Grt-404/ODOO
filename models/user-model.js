const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
    fullname: String,
    email: String,
    LoginID: {
        type: String,
        required: true,
        unique: true,
        minlength: [6, "Login ID must be at least 6 characters long"],
        maxlength: [12, "Login ID must not exceed 12 characters"]
    },
    password: {
        type: String,
        required: true // Passwords should be required for authentication
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],

    orders: {
        type: Array,
        default: []
    },
    contact: Number,
    image: {
        type: String, // Simpler placeholder type
        default: "" // Ensure a default value if you keep the field
    }

})
module.exports = mongoose.model("user", userSchema);