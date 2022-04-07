const express = require("express");
const router = express.Router();
const path = require("path");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const sql_config = require("../../private/configs/sql_config_nodelogin.json");

const sql_con = mysql.createConnection({
    host: sql_config.host,
    user: sql_config.user,
    password: sql_config.password,
    database: sql_config.database,
});

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "website_pages", "login", "login.html"));
});
router.get("/stylesheet", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "website_pages", "login", "login.css"));
});
router.get("/background-image", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "src", "pictures", "background_login.jpg"));
});

router.post("/auth", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    sql_con.query("SELECT password FROM accounts WHERE email = ? OR username = ?", [username, username], (err, data, fields) => {
        if (err) throw err;
        if (data.length > 0) {
            bcrypt.compare(password, data[0].password, (err, result) => {
                if (err) throw err;
                if (result) {
                    req.session.loggedin = true;
                    res.redirect("/home");
                } else {
                    res.send("Falscher Benutzername/E-Mail oder Passwort.");
                }
            });
        } else {
            res.send("Falscher Benutzername/E-Mail oder Paswort.");
        }
    });
});

module.exports = router;