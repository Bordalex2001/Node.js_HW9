//import { users } from "../data/users.js";
import bcrypt from "bcrypt";
import validator from "validator";
//import path from "node:path";
import { generateNews } from "../newsGenerator.js";
import nodemailer from "nodemailer";
import 'dotenv/config';
import { conn } from "../db.js";

export const checkUser = (req, res, next) => {
    res.locals.user = req.session?.user || null;
    next();
};

export const createUser = async (req, res, next) => {
    const { login, email, password, confirm_password } = req.body;

    if (!login || !email || !password || !confirm_password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Email is not valid' });
    }

    try {
        const [rows] = await conn.promise().query(
            'SELECT * FROM users WHERE login = ? OR email = ?', 
            [login, email]
        );

        if (rows.length > 0) {
            return res.status(400).json({ error: 'User with this login or email already exists' });
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        const image = req.file ? req.file.filename : null;

        await conn.promise().query(
            'INSERT INTO users (login, email, password, image) VALUES (?, ?, ?, ?)', 
            [login, email, hash, image]
        );

        next();
        return;
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const authUser = async (req, res, next) => {
    if (req.body && req.body.login && req.body.password){
        const { login, password } = req.body;
       
        try {
            const [rows] = await conn.promise().query(`SELECT * FROM users WHERE login = ?`, [login]);
            
            if (rows.length > 0) {
                const user = rows[0];

                if (bcrypt.compareSync(password, user.password)) {
                    req.body.email = user.email;
                    next();
                    return;
                }
            }
        } catch (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Internal server error");
        }
    }
    return res.status(400).redirect("/");
};

export const feedbackUser = (req, res, next) => {
    if(req.body && req.body.email && req.body.subject && req.body.message){
        const { email, subject, message } = req.body;
        const mailOpt = {
            from: process.env.SMTP_USER,
            to: email,
            subject: subject,
            text: message
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

export const sendNewsletter = (req, res, next) => {
    const recipients = req.body.recipients || ['user1@example.com', 'user2@example.com', 'user3@example.com'];
    const news = generateNews();

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipients.join(", "),
        subject: "Гарна новина для вас!",
        text: news,
    };
    
    const trans = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: true,
            minVersion: "TLSv1.2",
        },
    });
    

    try {
        trans.sendMail(mailOptions);
        res.locals.news = news;
        next();
    }
    catch (err) {
        console.error(`Error sending to ${email}:`, err);
        res.status(500).send('Error while sending newsletter');
    }
};