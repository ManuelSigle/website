const express = require("express");
const router = express.Router();
const path = require("path");
const mysql = require("mysql");
const sql_config = require("../../private/configs/sql_config_nodelogin.json");

const sql_con = mysql.createConnection({
    host: sql_config.host,
    user: sql_config.user,
    password: sql_config.password,
    database: sql_config.database,
});

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "website_pages", "register", "register.html"));
});

//TODO: eventuell vereinfachen?
router.post("/auth_register", async(req, res) => {
    let username = req.body.r_username;
    let email = req.body.r_email;
    let password = req.body.r_password;

    //Der Username wird in der Datenbank abgefragt
    sql_con.query("SELECT id FROM accounts WHERE username = ?", [username], (err, data, fields) => {
        if (err) throw err;
        //Größer als 0 == User existier schon!
        if (data.length > 0) {
            res.send("Der Username ist schon vergeben!");
        } else {
            //Wenn User noch nicht vergeben ist
            sql_con.query("SELECT id FROM accounts WHERE email = ?", [email], async(err, data, fields) => {
                if (err) throw err;
                //Wenn größer Null dann E-Mail schon vergeben
                if (data.length > 0) {
                    res.send("Die E-Mail wird schon benutzt!");
                } else {
                    //Wenn nicht dann Nutzer anlegen und weiterleiten
                    try {
                        var hashedPassword = await bcrypt.hash(password, 10);
                        sql_con.query("INSERT INTO accounts (username, password, email) VALUE (?, ?, ?)", [username, hashedPassword, email], (err, data, fields) => {
                            if (err) throw err;
                            res.redirect("/login");
                        })
                    } catch {
                        res.redirect("/home");
                    }
                }
            });
        }
    })
});

module.exports = router;