require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const indexRouter = require("./routes/index");
const cookieParser = require('cookie-parser');
const flash = require("connect-flash");
const expressSession = require("express-session");
const usersRouter = require('./routes/usersRouter');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET,
    })
);


app.use(flash());


app.use('/', indexRouter);
app.use('/users', usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})