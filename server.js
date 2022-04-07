console.log("Server startet!");

const mysql = require("mysql");
const express = require("express");
const app = express();
const session = require("express-session");
const path = require("path");
const https = require("https");
const fs = require("fs");
const http = express();
const bcrypt = require("bcrypt");
const sql_config = require("./private/sql_connection.json");
const web_config = require("./private/web_config.json");

var localhost_http = () => {
    http.listen(80);
    http.get("*", (req, res) => {
        res.writeHead(301, { Location: 'https://localhost' });
        res.end();
    });
}
var server_https = () => {
    http.listen(80);
    http.get("*", (req, res) => {
        res.writeHead(301, { Location: 'https://manuel-privat.de' });
        res.end();
    });

}

//! Schauen das das richtige ausgewählt ist
localhost_http();
//? server_https();

const sslServer = https.createServer({
        key: fs.readFileSync(path.join(__dirname, "private", "privat-key.pem")),
        cert: fs.readFileSync(path.join(__dirname, "private", "zertifikat.pem")),
    },
    app
);
sslServer.listen(443);

const SESSION_TIME = 1000 * 60 * 60;
const {
    SESS_LIFETIME = SESSION_TIME
} = process.env

const sql_con = mysql.createConnection({
    host: sql_config.host,
    user: sql_config.user,
    password: sql_config.password,
    database: sql_config.database,
});


app.get("/node_modules/bootstrap/dist/css/bootstrap.css", (req, res) => {
    res.sendFile(path.join(__dirname, "node_modules", "bootstrap", "dist", "css", "bootstrap.css"));
});
app.get("/node_modules/bootstrap/dist/js/bootstrap.bundle.js", (req, res) => {
    res.sendFile(path.join(__dirname, "node_modules", "bootstrap", "dist", "js", "bootstrap.bundle.js"));
})


//TODO: Es werden die optionen erstellt, wo für die Session wichtig sind. 
app.use(session({
    secret: web_config.secret,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: SESS_LIFETIME
    }
}));
//! Alles genauer nochmal nachschauen
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static'))); //nachschau


app.get("/", (req, res) => {
    if (req.session.loggedin == true) {
        res.redirect("/home");
    } else {
        res.sendFile(path.join(__dirname, "index", "login", "login.html"));
    }
});

app.post("/auth", (req, res) => {
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

var home_page = () => {
    app.get("/home", (req, res) => {
        if (req.session.loggedin) {
            res.sendFile(path.join(__dirname, "_website_pages", "home", "home.html"));

        } else {
            res.redirect("/");
        }
    });
    app.get("/home.css", (req, res) => {
        if (req.session.loggedin) {
            res.sendFile(path.join(__dirname, "_website_pages", "home", "home.css"));
        }
    })
    app.get("/background_home.jpg", (req, res) => {
        if (req.session.loggedin) {
            res.sendFile(path.join(__dirname, "_website_pages", "src", "pictures", "background_home.jpg"));
        }
    })
}
home_page();

var logout_page = () => {
    app.get("/logout", (req, res) => {
        if (req.session.loggedin == true) {
            req.session.loggedin = false;
            res.sendFile(path.join(__dirname, "_website_pages", "logout", "logout.html"));
        } else {
            res.redirect("/");
        }
    });

}
logout_page();

var login_page = () => {
    app.get("/login", (req, res) => {
        if (req.session.loggedin == true) {
            res.redirect("/home");
        } else {
            res.redirect("/");
        }
    });
    app.get("/login.css", (req, res) => {
        res.sendFile(path.join(__dirname, "index", "login", "login.css"));
    });
}
login_page();

app.get("/register", (req, res) => {
    if (req.session.loggedin) {
        res.redirect("/home");
    } else {
        res.sendFile(path.join(__dirname, "index", "register", "register.html"));
    }
})

//TODO: Eventuell vereinfachen
app.post("/auth_register", async(req, res) => {
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
    });
});