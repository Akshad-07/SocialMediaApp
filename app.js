// Load modules
const express = require('express');
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const Handlebars = require('handlebars');
const passport = require("passport");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
// connect to MongoURI exported from external file
const keys = require("./config/keys");
// User collection
const User = require("./models/user");
//link passports to the server
require("./passport/google-passport");
require("./passport/facebook-passport");
// initialize application
const app = express();
// Express config
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

//set global variable
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});
// setup template engine
app.engine("handlebars", exphbs.engine({
    defaultLayout: "main",
    // ...implement newly added insecure prototype access
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));

app.set("view engine", "handlebars");
// setup static file to serve css, javascript and images
app.use(express.static("public"));
// connect to remote database
mongoose.Promise = global.Promise;
mongoose.connect(keys.MongoURI, {
    useNewUrlParser: true
})
.then(() => {
    console.log("Connected to Remote database....");
}).catch((err) => {
    console.log(err);
});
// set ENVIRONMENT VARIABLE FOR port
const port = process.env.PORT || 5000;
// Handle routes
app.get('/', (req, res) =>{
    res.render("home");
});

app.get('/about', (req, res) => {
    res.render("about");
});

//GOOGLE AUTH ROUTE
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ["profile", "email"]
    }));

    app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/'
    }),
    (req, res) => {
        res.redirect("/profile");
    });

// Facebook Auth Routes
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/profile');
  });

//Handle profile routes
app.get("/profile", (req, res) => {
    User.findById({_id:req.user._id})
    .then((user) => {
        res.render("profile", {
            user:user
        });
    })   
});

//Handle user logout route
app.get("/logout", (req, res) =>{
    req.logout();
    res.redirect("/");
});


app.listen(port, () => {
    console.log("Server is running by Nodemon on port " + port);
});

