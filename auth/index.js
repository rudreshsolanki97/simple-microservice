"use strict";
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const _ = require("lodash");

const User = require("./models/user");
const Token = require("./models/token");

const requireLogin = require("./middleware/requireLogin");

const app = express();
app.use(bodyParser.json());

const mongoUrl =
  process.env.MONGO_URL || "mongodb://mongo:27017/simple-microservice";
const mongoOpts = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
};
const tokenExpiryTime = process.env.TOKEN_EXPIRY_TIME || 15;

mongoose
  .connect(mongoUrl, mongoOpts)
  .then(() => {
    console.log(`[*] connected to MongoDB`);
  })
  .catch((e) => {
    console.log(`exception while connection to mongodb: `, e);
    console.log(`[*] starting reconnection loop`);
    connectToMongo();
  });

/**
 * This API will validate & provide a freshly generated JWT Token
 */
app.post("/validate", requireLogin, async (req, res) => {
  try {
    const accessToken = req.accessToken;
    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, user) => {
        try {
          if (err) return res.sendStatus(403);
          delete user.iat;
          delete user.exp;

          const newAccessToken = generateAccessToken(user);
          res.status(200).json({ accessToken: newAccessToken });
        } catch (e) {
          console.log(`exception at ${__filename} /validate: `, e);
        }
      }
    );
  } catch (e) {
    console.log(`exception at${__filename}. /token: `, e);
    res.sendStatus(500);
  }
});


/**
 * User Logout
 */
app.delete("/logout", requireLogin, async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const tokenExists = await Token.findOne({ accessToken });
    if (tokenExists === null) return res.sendStatus(403);

    tokenExists.accessToken = "";
    await tokenExists.save();

    res.sendStatus(204);
  } catch (e) {
    console.log(`exception at ${__filename} /logout: `, e);
    res.sendStatus(500);
  }
});

/**
 * User Login
 */
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (_.isEmpty(email) || _.isEmpty(password)) {
      return res.sendStatus(401);
    }

    const user = await User.findOne({ email: email });
    if (user === null) return res.sendStatus(401);

    if (user.validPassword(password) !== true) return res.sendStatus(403);

    const userObj = user.toObject();
    delete userObj.password;

    const accessToken = generateAccessToken(userObj);
    const expiryDate = new Date(
      Date.now() + tokenExpiryTime * 60 * 1000
    ).toISOString();

    const newToken = new Token({
      email,
      accessToken,
      expiryDate,
    });
    await newToken.save();

    res.json({ accessToken, expiryDate });
  } catch (e) {
    console.log(`exception at ${__filename} /login: `, e);
    res.sendStatus(500);
  }
});

app.listen(3001, console.log(`[*] server started: 3001`));

/**
 * fallback for connection to mongodb
 */
function connectToMongo() {
  try {
    const reconnInt = setInterval(async () => {
      try {
        console.log("[*] connecting to mongodb");
        await mongoose.connect(mongoUrl, mongoOpts);
        console.log(`[*] connected to mongodb`);

        clearInterval(reconnInt);
      } catch (e) {
        console.log(`exception at ${__filename}.connectToMongo: `, e);
      }
    }, 5000);
  } catch (e) {
    console.log(`exception at ${__filename}.connectToMongo: `, e);
  }
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: `${tokenExpiryTime}m`,
  });
}
