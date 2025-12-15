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
    app.get("/", async (req, res) => {
        try {
            const foods  = await Food.find({}).sort({ description: 1 });
            res.render("home", { foods });
        } catch (error) {
            console.log("Erreur lors de la récupération des aliments: ", error);
            return res.status(500).send("Erreur serveur");
        }
    })

    app.get("/ajout", (req, res) => {
        return res.render("ajout");
    })

    // takes random foods from db to use in game
    app.get("/game", async (req, res) => {
        try {
            const foods = await Food.aggregate([{ $sample: { size: 2 } }]);
            if (foods.length < 2) {
                return res.send("Aucune donné trouvée pour le jeu");
            }
            return res.render("game", { rightFood: foods[0], leftFood: foods[1] });}
        catch (error) {
            console.error("Erreur lors du chargement du jeu: ", error);
            return res.status(500).send("Erreur serveur");
        }
    });

    // gets a random food to use in game
    app.get("/random-food", async (req, res) => {
        try {
            const lastFoodId = req.session.lastFoodId;
            const matchStage = lastFoodId ? { $match: { _id: { $ne: new mongoose.Types.ObjectId(lastFoodId) } } } : {$match: {} };
            const foods = await Food.aggregate([
                matchStage,
                { $sample: { size: 1 } }
            ]);
            if (foods.length === 0) {
                return res.status(404).send("Aucun aliment disponible.");
            }
            req.session.lastFoodId = foods[0]._id;
            return res.json(foods[0]);
        } catch (error) {
            console.error("Erreur lors de la récupération de l'aliment aléatoire: ", error);
            return res.status(500).send("Erreur serveur");
        }
    });

    app.get("/connexion", (req, res) => {
        return res.render("connexion");
    })

    app.get("/profile", requireAuth, async (req, res) => {
        try {
            const userId = req.session.user?._id;
            if (!userId) return res.redirect("/connexion");

            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            const totals = await Tracking.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
            { $lookup: { from: "foods", localField: "food", foreignField: "_id", as: "food" } },
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

            const foods = await Tracking.find({ user: userId }).populate("food");

            return res.render("profile", { aliments: foods, macros });

        } catch (err) {
            console.error("Profile error:", err);
            return res.render("profile", { aliments: [], macros: { calories: 0, prot: 0, glucides: 0, lipides: 0 } });
        }
        });

    // ####### POST REQUESTS #######
    app.post("/ajout", async (req, res) => {
        try {
            const { description, proteine, user, date } = req.body;
            const newFood = new Food ({description, proteine: Number(proteine), user, date: date ? new Date(date) : undefined});
            await newFood.save();
            res.redirect("/");
        } catch (error) {
            console.log("Erreur lors de l'ajout d'aliment", error);
            return res.status(500).send("Erreur lors de l'ajout d'aliment");
        }
    });

    app.post("/register", async(req, res) => {
        try {
            const { username, password, email } = req.body;
            if (!username || !password || !email) return res.status(400).send("Veuillez remplir tous les champs.");

            if (username.length < 3) return res.status(400).send("Veuillez fournir un nom d'utilisateur ayant minimum 3 caractères.");

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
                _id : newUser._id, 
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

            const isPasswordValid = await bcrypt.compare(password, userFound.hash);
            if (!isPasswordValid) return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect.");
            
            req.session.user = {
                _id: userFound._id,
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

    app.listen(8080, () => {
        console.log("Server is running on http://localhost:8080");
    });
})();