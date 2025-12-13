var express = require("express");
var session = require("express-session");
const { MongoClient } = require("mongodb");
var path = require("path");
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt");
var validator = require("validator");

var app = express()
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret:"qpozk2ç205!@",
    resave:false,
    saveUninitialized:true,
    cookie: {
        path: '/',
        httpOnly:true,
        maxAge:360000
    }
}));

(async () => {
    let users;
    let foods;


    // CONNECTION TO THE DATABASE, CREATION OF 2 COLLECTION AND SETTING 2 COLUMN SORT BY CROISSANT ORDER
    try {
        const client = new MongoClient('mongodb://localhost:27017');
        await client.connect();
        console.log("Connected to database");

        const db = client.db('a10_final');
        users = db.collection("users");
        await users.createIndex({username:1}, {unique:true});
        foods = db.collection("foods");
        await foods.createIndex({name : 1});
        console.log("Collections and indexes ready");

    } catch (error) {
        console.log("Database error while connection : ", error);
        process.exit(1);
    }

    // ####### MIDDLEWARES #######
    // CHECK IF THE USER IS CONNECTED 
    function requireAuth(req, res, next) {
        if (!req.session.user) {
            return res.redirect("/account");
        }
        next();
    }

    // SET THE USER FOR EVERY VIEW
    app.use((req, res, next) => {
        res.locals.user = req.session?.user || null;
        next();
    })

    // ####### GET REQUESTS #######
    app.get("/", async (req, res) => {
        try {
            const foodsList = await foods.find({}).toArray();
            foodsList.forEach(food => {
                if (food.date) {
                    food.formattedDate = new Date(food.date).toLocaleDateString("fr-FR");
                }
            });
            return res.render("home", { foods: foodsList });
        } catch (error) {
            console.log("Database error while fetching foods : ", error);
            return res.render("home", { foods: [] });
        }
    });

    // ####### POST REQUESTS #######

    app.listen(8080, () => {
        console.log("Server started on http://localhost:8080");
    });
})();