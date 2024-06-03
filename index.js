const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

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
    .then((username) => {
      res.send(
        `User ${username.username} already exists. Please choose another username.`
      );
    })
    .catch((err) => {
      const newUser = new User({ username: username });
      newUser.save().then((user) => {
        res.json({ username: user.username, _id: user._id });
      });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
