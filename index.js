const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const moment = require("moment");

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Connect to the database
mongoose.connect(process.env.MONGO_URI);

//Create schemas
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date },
});

//Create models
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

//Create new user
app.post("/api/users", (req, res) => {
  const username = req.body.username;

  //check if username already exists
  User.findOne({ username: username })
    .then((user) => {
      res.send(
        `User ${user.username} already exists. Please choose another username.`
      );
    })
    .catch((err) => {
      const newUser = new User({ username: username });
      newUser.save().then((user) => {
        return res.json({ username: user.username, _id: user._id });
      });
    });
});

//Get all users
app.get("/api/users", (req, res) => {
  User.find().then((users) => {
    return res.json(users);
  });
});

//Create new exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  let date;
  req.body.date ? (date = new Date(req.body.date)) : new Date();

  //check if user exists
  //const userId = mongoose.Types.ObjectId.createFromHexString(id);
  User.findById(userId)
    .then((user) => {
      const newExercise = new Exercise({
        userId: userId,
        description: description,
        duration: duration,
        date: date,
      });

      newExercise
        .save()
        .then((exercise) => {
          //_id is a unique identifier withing MongoDB so can't directly take the user id value
          return res.json({
            username: user.username,
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString(),
            _id: user._id,
          });
        })
        .catch((err) => {
          res.send("Unable to save exercise. Please try again.");
        });
    })
    .catch((err) => {
      res.send("User not found");
    });
});

//Get the log of exercises of a user
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  let from;
  let to;
  let limit;
  req.query.from
    ? (from = new Date(req.query.from))
    : (from = new Date("1900-01-01"));
  req.query.to ? (to = new Date(req.query.to)) : (to = new Date());
  req.query.limit ? (limit = parseInt(req.query.limit)) : (limit = 0);

  User.findById(userId)
    .then((user) => {
      //console.log(user);
      Exercise.find({ userId: userId, date: { $gte: from, $lte: to } })
        .then((exercises) => {
          let log = [];
          let count = 0;
          if (exercises.length === 0) {
            log = [];
          } else {
            count = exercises.length;
            log = exercises.map((exercise) => {
              return {
                description: exercise.description,
                duration: exercise.duration,
                date: exercise.date.toDateString(),
              };
            });
            log = log.slice(0, limit + 1);
          }

          return res.json({
            username: user.username,
            count: count,
            _id: userId,
            log: log,
          });
        })
        .catch((err) => {
          console.log(err);
          res.send("No exercises found for this user");
        });
    })
    .catch((err) => {
      console.log(err);
      res.send("User not found");
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
