"use strict";
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const requireLogin = require("./middleware/requireLogin");
const _ = require("lodash");

const User = require("./models/user");

const app = express();
app.use(bodyParser.json());

const mongoUrl =
  process.env.MONGO_URL || "mongodb://mongo:27017/simple-microservice";
const mongoOpts = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
};

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

app.post("/sign-up", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (
      _.isEmpty(email) ||
      _.isEmpty(password) ||
      _.isEmpty(firstName) ||
      _.isEmpty(lastName)
    )
      return res.sendStatus(401);

    const userExists = await User.findOne({ email });
    if (userExists !== null)
      return res.status(401).json({ error: "email already exists" });

    const newUser = new User({ email, firstName, lastName });
    newUser.password = newUser.generateHash(password);
    await newUser.save();

    res.sendStatus(201);
  } catch (e) {
    console.log(`exception  at ${__filename} /sign-up: `, e);
    res.sendStatus(500);
  }
});

app.get("/get-profile", requireLogin, async (req, res) => {
  try {
    const user = await User.findOne(
      { email: req.user.email },
      { password: 0 }
    ).lean();
    if (user === null) return res.sendStatus(403);

    res.json({ data: user });
  } catch (e) {
    console.log(`exception at ${__filename} /get-profile: `, e);
    res.sendStatus(500);
  }
});

app.listen(3002, console.log(`[*] server started: 3002`));

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
