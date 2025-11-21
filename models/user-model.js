const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
    fullname: String,
    email: String,
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
        type: Buffer,
        required: false
    },

})
module.exports = mongoose.model("user", userSchema);