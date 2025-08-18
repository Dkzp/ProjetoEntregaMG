const express = require('express');
const bodyParser = require('body-parser');
const path = require("path")

const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")))

module.exports = app;