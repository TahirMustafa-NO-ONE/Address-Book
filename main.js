const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const ejs = require("ejs");
const session = require('express-session');

const port = process.env.port || 5000;

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configure session middleware
app.use(session({
    secret: 'tahir-123',
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 6000000
    }
}));

// Load users data
const users = require("./users.json");

const IsLoggedIn = (req, res, next) => {
    if (req.session.IsLogedIn) {
        next();
    } else {
        res.render('login', { message: "Your session expired :(.... and You are not authoriaed to perform this operation please login first" })
    }
}
app.use((req, res, next) => {
    res.locals.IsLogedIn = req.session.IsLogedIn || false;
    next();
});


// Routes
app.get("/", (req, res) => {
    res.render('index', { IsLogedIn: req.session.IsLogedIn });
});
app.get('/login', (req, res) => {
    res.render('login', { message: null, IsLogedIn: req.session.IsLogedIn });
});

app.post('/login', (req, res) => {
    const { Email, Password } = req.body;
    if (Email === 'admin@example.com' && Password === 'admin123') {
        req.session.IsLogedIn = true;
        res.redirect('/home');
    } else {
        req.session.IsLogedIn = false
        console.log("Username not found.");
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("could not destroy session");
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    })
})

app.get("/home", (req, res) => {
    // Pass the IsLogedIn variable to the home template
    res.render("home", { users: users, IsLogedIn: req.session.IsLogedIn });
});
app.get("/", (req, res) => {
    res.render('index', { IsLogedIn: req.session.IsLogedIn });
});

app.get("/update/:id", IsLoggedIn, (req, res) => {
    const userID = parseInt(req.params.id);
    const userToUpdate = users.find((user) => user.id === userID);
    if (userToUpdate) {
        res.render("updateform", { user: userToUpdate, IsLogedIn: req.session.IsLogedIn});
    } else {
        res.status(404).send("User Not Found :( ");
    }
});

// main.js

app.post("/update/:id", IsLoggedIn, (req, res) => {
    const userId = parseInt(req.params.id);
    const { name, phone, gender, skills, address, city } = req.body;
    // Basic data validation
    if (!name || !phone || !address || !city || !gender || !skills) {
        return res.status(400).send("Please provide all required information.");
    }

    const index = users.findIndex((user) => user.id === userId);
    if (index != -1) {
        users[index] = { id: userId, name, phone, gender, skills, address, city };
        fs.writeFile("./users.json", JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error(" :( Error writing to users.json.....", err);
                return res.status(500).send(" :( Error updating user information.....");
            }
            res.redirect("/home");
        });
    } else {
        res.status(404).send(" :( User not found....");
    }
});

// main.js

app.post("/delete", IsLoggedIn, (req, res) => {
    const userId = parseInt(req.body.id); // Get user ID from the payload

    // Find the index of the user with the provided ID
    const index = users.findIndex((user) => user.id === userId);

    if (index !== -1) {
        // Remove the user from the array
        users.splice(index, 1);

        // Write the updated array back to the JSON file
        fs.writeFile("./users.json", JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error("Error writing to users.json:", err);
                return res.status(500).send("Error deleting user.");
            }

            res.redirect("/home");
        });
    } else {
        // If user is not found, send 404 response
        res.status(404).send("User not found.");
    }
});

app.get('/add', IsLoggedIn, (req, res) => {
    res.render('addform', { errorMessage: null, IsLogedIn: req.session.IsLogedIn});
});

app.post('/add', IsLoggedIn, (req, res) => {
    const { id, name, phone, gender, skills, address, city } = req.body;
    const exstingUser = users.find((user) => user.id === parseInt(id));
    if (exstingUser) {
        const errorMessage = " :( User with this ID already exist... Please use another ID..."
        return res.render('addform', { errorMessage: errorMessage, IsLogedIn: req.session.IsLogedIn});
    }
    const newUser = {
        id: parseInt(id),
        name,
        phone,
        gender,
        skills,
        address,
        city
    }
    users.push(newUser);
    fs.writeFile("./users.json", JSON.stringify(users, null, 2), (err) => {
        if (err) {
            console.error("Error writing to users.json:", err);
            return res.status(500).send("Error adding user.");
        }

        // Redirect to the home page
        res.redirect('/home');
    });
});

app.get('/show/:id', (req, res) => {
    const user_id = parseInt(req.params.id);
    const selected_user = users.find(user => user.id === user_id);
    res.render('showRecord', { user: selected_user, IsLogedIn: req.session.IsLogedIn || false});
});


const server = app.listen(port, () => {
    console.log(`server is running on port http://localhost:${port}`);
});
