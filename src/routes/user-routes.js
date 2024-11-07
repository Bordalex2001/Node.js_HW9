import { Router } from "express";
import { createUser, authUser, feedbackUser } from "../middlewares/user-middleware.js";
import { users } from "../data/users.js";
import path from "node:path";
import multer from "multer";

const storage = multer.diskStorage({
    destination: 'photos/',
    filename: (req, file, cb) => {
      cb(null, req.body.login + path.extname(file.originalname));
    }
});

const configMulter = multer({ storage: storage });

const userRoutes = Router();

userRoutes
    .route("/")
    .get((req, res) => res.json(users));

userRoutes
    .route("/signup")
    .get((req, res) => res.render("form_register"))
    .post(configMulter.single("file"), createUser, (req, res) => {
        req.session.user = {
            login: req.body.login,
            email: req.body.email,
        };
        res.redirect("/");
});

userRoutes.route("/signin")
    .get((req, res) => res.render("form_auth"))
    .post(authUser, (req, res) => {
        req.session.user = {
            login: req.body.login,
            email: req.body.email,
        };
        res.redirect("/");
});

userRoutes.get("/logout", (req, res) => {
    if (req.session){
        req.session.destroy(); //знищення сесії
    }
    res.redirect("/");
});

userRoutes
    .route("/feedback")
    .get((req, res) => {
        res.render("form_feedback");
    })
    .post(feedbackUser, (req, res) => {
        res.status(400).redirect("/");
    });

export default userRoutes;