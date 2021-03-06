// Load modules
const express = require('express');
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const Handlebars = require('handlebars');
const passport = require("passport");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
// connect to MongoURI exported from external file
const keys = require("./config/keys");
// Load Models
const User = require("./models/user");
const Post = require("./models/posts");
//link passports to the server
require("./passport/google-passport");
require("./passport/facebook-passport");
require("./passport/instagram-passport");
// link helpers
const {
    ensureAuthentication,
    ensureGuest
} = require("./helpers/auth");
const { blockParams } = require('handlebars');
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
app.use(methodOverride("_method"));
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
app.get('/', ensureGuest, (req, res) => {
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
    passport.authenticate('facebook', {
        scope: "email"
    }));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/profile');
    });

// Instagram Auth Routes
app.get('/auth/instagram',
    passport.authenticate('instagram'));

app.get('/auth/instagram/callback',
    passport.authenticate('instagram', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/profile');
    });

//Handle profile routes
app.get("/profile", ensureAuthentication, (req, res) => {
    Post.find({ user: req.user._id })
        .populate("user")
        .sort({ date: "desc" })
        .then((posts) => {
            res.render("profile", {
                posts: posts
            });
        });
});

//Handle routes for all users
app.get("/users", ensureAuthentication, (req, res) => {
    User.find({}).then((users) => {
        res.render("users", {
            users: users
        });
    });
});

//Display one user profile
app.get("/user/:id", ensureAuthentication, (req, res) => {
    User.findById({ _id: req.params.id })
        .then((user) => {
            res.render("user", {
                user: user
            });
        });
});

//Hanle Email post route
app.post("/addEmail", ensureAuthentication, (req, res) => {
    const email = req.body.email;
    User.findById({ _id: req.user._id })
        .then((user) => {
            user.email = email;
            user.save()
                .then(() => {
                    res.redirect("/profile");
                });
        });
});

//HANDLE PHONE POST ROUTE
app.post("/addphone", ensureAuthentication, (req, res) => {
    const phone = req.body.phone;
    User.findById({ _id: req.user._id })
        .then((user) => {
            user.phone = phone;
            user.save()
                .then(() => {
                    res.redirect("/profile");
                });
        });
});

// HANDLE LOCATION ROUTE
app.post("/addLocation", ensureAuthentication, (req, res) => {
    const location = req.body.location;
    User.findById({ _id: req.user._id })
        .then((user) => {
            user.location = location;
            user.save()
                .then(() => {
                    res.redirect("/profile");
                });
        });
});

//HANDLE POST ROUTES FOR POSTS

app.get("/addPost", ensureAuthentication, (req, res) => {
    res.render("addPost");
});

//HANDLE POST ROUTE
app.post("/savePost", ensureAuthentication, (req, res) => {
    var allowComments;
    if (req.body.allowComments) {
        allowComments = true;
    } else {
        allowComments = false;
    }
    const newPost = {
        title: req.body.title,
        body: req.body.body,
        status: req.body.status,
        allowComments: allowComments,
        user: req.user._id
    }
    new Post(newPost).save()
        .then(() => {
            res.redirect("/posts");
        });
});

//handle edit post route
app.get("/editPost/:id", ensureAuthentication, (req, res) => {
    Post.findOne({ _id: req.params.id })
        .then((post) => {
            res.render("editingPost", {
                post: post
            });
        });
});

//handle put route to save edited post
app.put("/editingPost/:id", ensureAuthentication, (req, res) => {
    Post.findOne({ _id: req.params.id })
        .then((post) => {
            var allowComments;
            if (req.body.allowComments) {
                allowComments = true;
            } else {
                allowComments = false;
            }
            post.title = req.body.title;
            post.body = req.body.body;
            post.status = req.body.status;
            post.allowComments = allowComments;
            post.save()
                .then((post) => {
                    res.redirect("/profile");
                });
        });
});

//HANDLE DELETE ROUTE
app.delete("/:id", ensureAuthentication, (req, res) => {
    Post.remove({ _id: req.params.id })
        .then(() => {
            res.redirect("profile");
        });
});
//HANDLE POSTS ROUTE
app.get("/posts", ensureAuthentication, (req, res) => {
    Post.find({ status: "public" })
        .populate("user")
        .populate("comments.commentUser")
        .sort({ date: "desc" })
        .then((posts) => {
            res.render("publicPosts", {
                posts: posts
            });
        });
});
//display single users all public posts
app.get("/showposts/:id", ensureAuthentication, (req, res) => {
    Post.find({ user: req.params.id, status: "public" })
        .populate("user")
        .sort({ date: "desc" })
        .then((posts) => {
            res.render("showUserPosts", {
                posts: posts
            });
        });
});
//Save comments into database
app.post("/addComment/:id", ensureAuthentication, (req, res) => {
    Post.findOne({ _id: req.params.id })
        .then((post) => {
            const newComment = {
                commentBody: req.body.commentBody,
                commentUser: req.user._id
            }
            post.comments.push(newComment)
            post.save()
                .then(() => {
                    res.redirect("/posts");
                });
        });
});

//Handle user logout route
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});


app.listen(port, () => {
    console.log("Server is running by Nodemon on port " + port);
});

