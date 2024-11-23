import express from "express";
import { PORT } from "./config.js";
import mongoose from "mongoose";
import { MONGO_URI } from "./_db.js";
import cors from "cors";
import dotenv from "dotenv";
import postRoute from "./routes/postRoute.js";
import authRoute from "./routes/authRoute.js";
import UserRoute from "./routes/userRoute.js";
import { verifyToken } from "./middleware/verifyToken.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import "./firebase.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
dotenv.config();

app.use("/memory", verifyToken, postRoute);
app.use("/user", UserRoute);
app.use("/auth", authRoute);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });
