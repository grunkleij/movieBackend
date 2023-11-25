const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/UserModel");
const axios = require('axios')
const cors = require('cors')
const app = express();
app.use(express.json());

app.use(cors())

app.post("/user", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      // If a user with the same email already exists, return a conflict response
      existingUser.movieWatchList.push(...req.body.movieWatchList);
      await existingUser.save();
      return res.status(200).json(existingUser); // Return status 200 
    }

    // If no user with the same email exists, create a new user
    const newUser = {
      email: req.body.email,
      movieWatchList: req.body.movieWatchList,
    };
    const user = await User.create(newUser);
    res.status(201).json(user); // Return status 201 for successful creation
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" }); // Return status 500 for internal server error
  }
});


app.delete("/user/:id/:deleteId", async (req, res) => {
  const { id, deleteId } = req.params;
  try {
    const user = await User.findOne({ "email": id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the index of the value to delete
    const indexToDelete = user.movieWatchList.indexOf(deleteId);

    // If the value is found, store it, remove it, and then save the user
    if (indexToDelete !== -1) {
      const deletedValue = user.movieWatchList[indexToDelete];
      let valueD;

      // Corrected axios call
      await axios.get(`https://api.themoviedb.org/3/movie/${deleteId}?api_key=582913cbc1255e68ef241e0956a7ae7c`)
        .then((response) => {
          console.log('yes')
          valueD = response.data;
        });

      user.movieWatchList.splice(indexToDelete, 1);
      await user.save();
      return res.status(200).json({ message: `Value ${deletedValue} deleted from movieWatchList`, valueD });
    } else {
      return res.status(404).json({ error: `Value ${deleteId} not found in movieWatchList` });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.find({ "email": id })
    return res.status(200).json(user);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" }); // Return status 500 for internal server error
  }
});

mongoose
  .connect(process.env.URL)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
