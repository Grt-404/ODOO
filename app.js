const express = require("express");
const app = express();
require('dotenv').config();
const db = require('./config/mongoose-connection');
const path = require("path");
const indexRouter = require("./routes/index");
const cookieParser = require('cookie-parser');
const flash = require("connect-flash");
const expressSession = require("express-session");
const usersRouter = require('./routes/usersRouter');
const productsRouter = require('./routes/productsRouter');
const operationsRouter = require('./routes/operationsRouter');
const warehouseRouter = require('./routes/wareHouseRouter');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// 1. Session MUST be set up first
app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET || "secret", // Added fallback for safety
    })
);


app.use(flash());


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/operations', operationsRouter);
app.use('/warehouses', warehouseRouter);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});