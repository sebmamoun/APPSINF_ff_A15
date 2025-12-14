var express = require("express");
var session = require("express-session");
var mongoose = require("mongoose");
var path = require("path");
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt");
var validator = require("validator");
const { name } = require("ejs");

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
            username:String,
            email:String,
            hash:String
        });
        User = mongoose.model('User', userSchema);

        const foodSchema = new mongoose.Schema({
            description:String,
            proteine:Number,
            user:String,
            date:{type:Date, default:Date.now},
            lastUpdate: {type:Date, default:Date.now}
        });
        Food = mongoose.model('Food', foodSchema);

    } catch (error) {
        console.log("Database error while connection : ", error);
    }

    // ####### MIDDLEWARES #######
    // CHECK IF THE USER IS CONNECTED 
    function requireAuth(page) {
        return function (req, res, next) {
            if (!req.session.user) {
                return res.render("connexion");
            }
            next();
        }
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

    app.get("/ajout", (req, res) => {
        return res.render("ajout");
    })

    app.get("/profile", (req, res) => {
        return res.render("profile");
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

    // ####### POST REQUESTS #######
    app.post("/register", async(req, res) => {
        try {
            const { username, password, email } = req.body;
            if (!username || !password || !email) return res.status(400).send("Veuillez remplir tous les champs.");

            if (!validator.isEmail(email)) {
                return res.status(400).send("Veuillez fournir une adresse email valide.");
            }

            const usernameClean = username.trim().toLowerCase();

            // Username check
            const existingUser = await User.findOne({username: usernameClean});
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
            res.redirect("/");

        } catch (error) {
            if (error.code === 11000) return res.status(400).send("Nom d'utilisateur déjà utilisé.");
            console.log("Error while register for ",username," with the error : ", error);
            return res.status(500).send("Erreur serveur, veuillez réessayer plus tard.");
        }
    });

    app.post("/login", async(req, res) => {
        try {
            
            const { username, password} = req.body;
            if (!username || !password) return res.status(400).send("Veuillez remplir tous les champs.");
            
            const usernameClean = username.trim().toLowerCase();
            const userFound =  await User.findOne({username: usernameClean});
            if (!userFound) return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect.");

            const isPasswordValid = await bcrypt.compare(password, userFound.hash);
            if (!isPasswordValid) return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect.");
            
            
            req.session.user = {
                id: userFound.__id,
                username: userFound.username,
                email: userFound.email,
            };
            
            return res.redirect("/");

        } catch (error) {
            console.log("Error while login into ", username, " with the error : ", error);
            return res.status(500).send("Erreur serveur, veuillez réessayer plus tard.");
        }
    });

    app.listen(8080, () => {
        console.log("Server is running on http://localhost:8080");
    });
})();