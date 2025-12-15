var express = require("express");
var session = require("express-session");
var mongoose = require("mongoose");
var path = require("path");
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt");
var validator = require("validator");
const { name } = require("ejs");
const { type } = require("os");

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

let User;
let Food;

(async () => {
    // CONNECTION TO THE DATABASE, CREATION OF 2 COLLECTION AND SETTING 2 COLUMN SORT BY CROISSANT ORDER
    try {
        mongoose.connect('mongodb://localhost:27017/a15');

        const userSchema = new mongoose.Schema({
            username: {type: String, required: true, minlength: 3, unique: true},
            email: {type: String, required: true, unique: true}, 
            hash: {type: String, required: true},
            rank: {type: String, enum: ['user', 'admin'], default: 'user'},
        },
        {timestamps: true});
        User = mongoose.model('User', userSchema);

        const foodSchema = new mongoose.Schema({
            name: {type: String, required: true},
            description: {type: String, required:true},
            price:{type: Number, required: true},
            prot:{type: Number, required: true},
            glucides:{type: Number, required: true},
            lipides:{type: Number, required: true},
            calories:{type: Number, required: true},},
        {timestamps: true});
        Food = mongoose.model('Food', foodSchema);

        const trackingSchema = new mongoose.Schema({
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        food: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        quantity: { type: Number, required: true, min: 0.01 },
        date: { type: Date, default: Date.now }
        }, { timestamps: true });
        Tracking = mongoose.model('Tracking', trackingSchema);
        
        const macroSchema = new mongoose.Schema({
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            calories : {type: Number, required: true},
            prot : {type: Number, required: true},
            glucides : {type: Number, required: true},
            lipides  : {type: Number, required: true}
        })
        Macro = mongoose.model('Macro', macroSchema);

    } catch (error) {
        console.log("Database error while connection : ", error);
    }

    // ####### MIDDLEWARES #######
    // CHECK IF THE USER IS CONNECTED 
    function requireAuth(req, res, next) {
        if (req.session.user) return next();

        if (req.method === 'GET') {
            req.session.direction = req.originalUrl;
        }

        return res.redirect('/connexion');
    }

    // SET THE USER FOR EVERY VIEW
    app.use((req, res, next) => {
        res.locals.user = req.session?.user || null;
        next();
    })

    // ####### GET REQUESTS #######
    app.get("/", (req, res) => {
        return res.render("home");
    })


    app.get("/connexion", (req, res) => {
        return res.render("connexion");
    })

    app.get("/profile", requireAuth, async (req, res) => {
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const totals = await Tracking.aggregate([
        {
            $match: {
            user: req.session.user._id,
            date: { $gte: start, $lte: end }
            }
        },
        {
            $lookup: {
            from: "foods",
            localField: "food",
            foreignField: "_id",
            as: "food"
            }
        },
        { $unwind: "$food" },
        {
            $group: {
            _id: null,
            calories: { $sum: { $multiply: ["$food.calories", "$quantity"] } },
            prot:     { $sum: { $multiply: ["$food.prot", "$quantity"] } },
            glucides: { $sum: { $multiply: ["$food.glucides", "$quantity"] } },
            lipides:  { $sum: { $multiply: ["$food.lipides", "$quantity"] } }
            }
        }
        ]);

        const macros = totals[0] ?? { calories: 0, prot: 0, glucides: 0, lipides: 0 };
        const foods = await Tracking
            .find({ user: req.session.user._id })
            .populate("food");

        return res.render("profile", {aliments: foods, macros: macros});
    })

    // ####### POST REQUESTS #######
    app.post("/register", async(req, res) => {
        try {
            const { username, password, email } = req.body;
            if (!username || !password || !email) return res.status(400).send("Veuillez remplir tous les champs.");

            if (!validator.isEmail(email)) {
                return res.status(400).send("Veuillez fournir une adresse email valide.");
            }

            // Username check
            const existingUser = await User.findOne({username: username});
            if (existingUser) {
                return res.status(400).send("Nom d'utilisateur déjà pris.");
            }

            const existingEmail = await User.findOne({email: email});
            if (existingEmail) {
                return res.status(400).send("Adresse email déjà reliée à un compte.");
            }

            // Hashing the password to increase security
            const hash = await bcrypt.hash(password, 12);

            // Saving the user informations into the database
            const newUser = User ({username, email, hash});
            await newUser.save();
            
            // Saving some user informations into the session
            req.session.user = {
                id : newUser._id, 
                username: username, 
                email: email
            };

            const redirectTo = req.session.direction || '/profile';
            delete req.session.direction;

            return res.redirect(redirectTo);

        } catch (error) {
            if (error.code === 11000) return res.status(400).send("Nom d'utilisateur déjà utilisé.");
            console.log("Error while register for ",req.body?.username," with the error : ", error);
            return res.status(500).send("Erreur serveur, veuillez réessayer plus tard.");
        }
    });

    app.post("/login", async(req, res) => {
        try {
            
            const { username, password} = req.body;
            if (!username || !password) return res.status(400).send("Veuillez remplir tous les champs.");
            
            const userFound =  await User.findOne({username: username});
            if (!userFound || !userFound.hash) {
            return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect.");
            }
            if (!userFound) return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect.");

            const isPasswordValid = await bcrypt.compare(password, userFound.hash);
            if (!isPasswordValid) return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect.");
            
            req.session.user = {
                id: userFound._id,
                username: userFound.username,
                email: userFound.email,
            };

            const redirectTo = req.session.direction || '/profile';
            delete req.session.direction;

            return res.redirect(redirectTo);

        } catch (error) {
            console.log("Error while login into ", req.body?.username, " with the error : ", error);
            return res.status(500).send("Erreur serveur, veuillez réessayer plus tard.");
        }
    });

    app.listen(8080);
})();