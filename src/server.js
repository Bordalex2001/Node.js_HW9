import express from "express";
import exphbs from "express-handlebars";
import cookieParser from "cookie-parser";
import session from "express-session";
import "dotenv/config";
import path from "node:path";
import siteRoutes from "./routes/site-routes.js";
import userRoutes from "./routes/user-routes.js";
import { checkUser } from "./middlewares/user-middleware.js";
const PORT = process.env.PORT || 3000;
import { createClient } from "redis";
import RedisStore from "connect-redis";
//#region options for hbs
const hbs = exphbs.create({
    defaultLayout: "main",
    extname: "hbs"
});
//#endregion

//REDIS = Remote Dictionary Server
// const client = createClient({
//     url: "redis://127.0.0.1:6379"
// });

const app = express();
app.use(cookieParser());
app.use(
session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
}));
app.use(checkUser);
//#region handlebars
app.use(express.static("public"));
app.use(express.static("photos"));
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join("src", "views"));
//#endregion
app.use(express.urlencoded({ extended: true }));
app.use(siteRoutes);
app.use("/user", userRoutes);
    
app.listen(PORT, () => {
    console.log(`Server is running http://localhost:${PORT}`);
});