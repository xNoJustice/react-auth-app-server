const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");
const app = express();
const { User } = require("./User");
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  User.find({})
    .then((userList) => res.status(200).json(userList))
    .catch((e) => res.status(500).json(e));
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let checkUsername = await User.findOne({
      username,
    });
    let checkEmail = await User.findOne({
      email,
    });
    if (checkUsername) {
      return res.status(400).json({
        message: "Username Already Exists",
      });
    }
    if (checkEmail) {
      return res.status(400).json({
        message: "Email Already Exists",
      });
    }
    const user = new User({
      username,
      email,
      password,
    });
    await user.save();

    res.status(200).json({
      success: "Success",
    });
  } catch (err) {
    res.status(500).send("Error in Saving");
  }
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User Not Exist",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Email or Password wrong!",
      });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
    jwt.sign(
      payload,
      "randomString",
      {
        expiresIn: 3600,
      },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
          token: "Bearer " + token,
        });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Sunucu çalışıyor... ${PORT} | MongoDB'ye bağlanılacak..`);
  await mongoose.connect("mongodb://localhost:27017/auth", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("MongoDB'ye bağlantı başarılı!");
});
