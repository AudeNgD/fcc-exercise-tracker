const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { count } = require("firebase/firestore");

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
  date: { type: Date, default: Date.now },
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
        res.json({ username: user.username, _id: user._id });
      });
    });
});

//Get all users
app.get("/api/users", (req, res) => {
  User.find().then((users) => {
    res.json(users);
  });
});

//Create new exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.body[":_id"];
  const description = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date;

  if (!date) {
    date = new Date();
  }

  const newExercise = new Exercise({
    userId: userId,
    description: description,
    duration: duration,
    date: date,
  });

  //check if user exists
  //const userId = mongoose.Types.ObjectId.createFromHexString(id);
  User.findById(userId)
    .then((user) => {
      newExercise.username = user.username;
      newExercise
        .save()
        .then((exercise) => {
          //_id is a unique identifier withing MongoDB so can't directly take the user id value
          res.json({
            _id: exercise.userId,
            username: exercise.username,
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString(),
          });
        })
        .catch((err) => {
          console.log(err);
          res.send("User not found");
        });
    })
    .catch((err) => {
      res.send("User not found");
    });
});

//Get the log of exercises of a user
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;

  User.findById(userId).then((user) => {
    Exercise.find({ userId: user._id, date: { $gte: from, $lte: to } })
      .limit(limit)
      .then((exercises) => {
        exercises.forEach((exercise) => {
          exercise.date.toDateString();
          console.log(exercise.date);
        });
        exercises = exercises.filter((exercise) => {
          res.json({
            username: user.username,
            count: exercises.length,
            log: exercises,
          });
        });
      })
      .catch((err) => {
        res.send("User not found");
      });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
