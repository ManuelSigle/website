const express = require("express");
const router = express.Router();
const path = require("path");


router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "website_pages", "home", "home.html"));
});
router.get("/stylesheet", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "website_pages", "home", "home.css"));
});
router.get("/background-image", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "src", "pictures", "background_home.jpg"));
});

module.exports = router;