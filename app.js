import express from "express";
import { PORT } from "./config.js";
import mongoose from "mongoose";
import { MONGO_URI } from "./_db.js";
import Memory from "./model/memoryModel.js";
import cors from "cors";
const app = express();

app.use(express.json());

app.use(cors());

app.post("/memory", (req, res) => {
  try {
    if (
      !req.body.title ||
      !req.body.images ||
      !req.body.content ||
      !req.body.author
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMemory = new Memory({
      title: req.body.title,
      images: req.body.images,
      content: req.body.content,
      author: req.body.author,
    });

    const memory = Memory.create(newMemory);
    res.status(201).json({
      message: "Memory created",
      data: newMemory,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
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
