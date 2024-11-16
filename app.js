import express from "express";
import { PORT } from "./config.js";
import mongoose from "mongoose";
import { MONGO_URI } from "./_db.js";
import Memory from "./model/memoryModel.js";
import cors from "cors";
import cloudinary from "cloudinary";
import multer from "multer";
import { UploadClient } from "@uploadcare/upload-client";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import dotenv from "dotenv";

const app = express();

app.use(express.json());

app.use(cors());
dotenv.config();

// const uploadClient = new UploadClient({
//   publicKey: "6feca71c7e13682e4765",
// });
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: "G-DDFWDY8JS6",
};
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

const upload = multer({ storage: multer.memoryStorage() });

app.post("/memory", upload.array("images"), async (req, res) => {
  try {
    const imageUploads = req.files.map(async (file) => {
      const storageRef = ref(
        storage,
        `memories/${Date.now()}-${file.originalname}`
      );
      await uploadBytes(storageRef, file.buffer);
      return getDownloadURL(storageRef);
    });

    const imageUrls = await Promise.all(imageUploads);

    const memory = await Memory.create({
      title: req.body.title,
      author: req.body.author,
      content: req.body.content,
      images: imageUrls,
    });

    res.status(201).json({ success: true, data: memory });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/memory", async (req, res) => {
  try {
    const memories = await Memory.find();
    res.status(200).json({
      message: "Memories fetched",
      data: memories,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

app.get("/memory/:id", async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);
    res.status(200).json({
      message: "Memory fetched",
      data: memory,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

app.put("/memory/:id", async (req, res) => {
  try {
    const memory = await Memory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      message: "Memory updated",
      data: memory,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

app.delete("/memory/:id", async (req, res) => {
  try {
    const memory = await Memory.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Memory deleted",
      data: memory,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

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
