import express from "express";
import Memory from "../model/memoryModel.js";
import User from "../model/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { auth } from "../firebase.js";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

const Router = express.Router();

Router.post("/google-auth", async (req, res) => {
  const { idToken } = req.body;

  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const { email, displayName, photoURL } = result.user;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: displayName || "Anonymous",
        profilePicture: photoURL,
      });
    }
    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: age,
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
      })
      .status(200)
      .json({
        message: "User logged in with Google",
        data: user,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

Router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Check if user already exists first
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email,
      password: hashPassword,
      name: name || "Anonymous",
    });

    // Save user
    const savedUser = await newUser.save();

    // Send single response
    return res.status(201).json({
      message: "User created",
      data: savedUser,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to create user",
    });
  }
});

Router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid Credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const age = 1000 * 60 * 60 * 24 * 7; // 1 week

    const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: age,
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
        // secure: true,
      })
      .status(200)
      .json({
        message: "User logged in",
        data: user,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

Router.post("/logout", (req, res) => {
  res.clearCookie("token").status(200).json({ message: "User logged out" });
});
export default Router;
