import { users } from "../data/users.js";
import bcrypt from "bcrypt";
import validator from "validator";
import path from "node:path";
import { generateNews } from "../newsGenerator.js";
import nodemailer from "nodemailer";

import 'dotenv/config';

export const checkUser = (req, res, next) => {
    if (req.session && req.session.user){
        res.locals.user = users.find(user => user.login === req.session.user.login);
    }
    next();
};

export const createUser = (req, res, next) => {
    if(!req.body.login || !req.body.email || !req.body.password || !req.body.confirm_password){
        return res.status(400).json({ error: 'All fields are required' });
    }
    if(req.body.password !== req.body.confirm_password){
        return res.status(400).json({ error: 'Passwords do not match' });
    }
    if(req.body 
        && req.body.login 
        && req.body.email 
        && req.body.password 
        && req.body.confirm_password 
        && req.body.password === req.body.confirm_password)
    {
        if(!validator.isEmail(req.body.email)){
           return res.status(400).json({ error: "Email is not valid" });
        }
        
        const { login, email, password } = req.body;

        const user = users.find(el => el.login === login || el.email === email);
        if(!user){
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            users.push({
                id: users.length + 1,
                login: login,
                email: email,
                password: hash,
                image: login + path.extname(req.file.originalname)
            });
            next();
            return;
        }
    }
    res.status(400).redirect("/");
}

export const authUser = (req, res, next) => {
    if (req.body && req.body.login && req.body.password){
        const { login, password } = req.body;
        const user = users?.find((el) => el.login == login);
        if(bcrypt.compareSync(password, user.password)){
            req.body.email = user.email;
            next();
            return;
        }
    }
    return res.status(400).redirect("/");
};

export const feedbackUser = (req, res, next) => {
    if(req.body && req.body.email && req.body.subject && req.body.message){
        const recipient = 'balex0121@gmail.com';
        const news = generateNews();

        //const { email, subject, message } = req.body;
        const mailOpt = {
            from: process.env.SMTP_USER,
            to: recipient,
            subject: "Гарна новина для вас!",
            text: news
        };

        const trans = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: true,
                minVersion: "TLSv1.2"
            }
        });

        trans.sendMail(mailOpt, (err, info) => {
            console.log(err, info);
            if(err){
                console.log(err);
                res.status(400).redirect("/");
            }
            else{
                console.log(info);
                res.status(201).redirect("/");
            }
            return;
        });
    }
    next();
};