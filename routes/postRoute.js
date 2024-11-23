import express from "express";
import Memory from "../model/memoryModel.js";
import User from "../model/UserModel.js";
import { storage } from "../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import multer from "multer";

const Router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

Router.post("/", upload.array("images"), async (req, res) => {
  try {
    const { title, content, imageUrls: providedImageUrls } = req.body;
    const userId = req.userId; // This comes from the auth middleware

    let imageUrls = [];

    // Check if files are uploaded
    if (req.files && req.files.length > 0) {
      // Log the uploaded files
      console.log("Uploaded files:", req.files);

      // Upload images to Firebase
      const imageUploads = req.files.map(async (file) => {
        const storageRef = ref(
          storage,
          `memories/${userId}/${Date.now()}-${file.originalname}`
        );
        await uploadBytes(storageRef, file.buffer);
        return getDownloadURL(storageRef);
      });

      imageUrls = await Promise.all(imageUploads);
    } else if (providedImageUrls) {
      // Use provided image URLs
      imageUrls = Array.isArray(providedImageUrls)
        ? providedImageUrls
        : [providedImageUrls];
    } else {
      return res
        .status(400)
        .json({ success: false, error: "No files or image URLs provided" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Create memory with user reference
    const memory = await Memory.create({
      title,
      content,
      images: imageUrls,
      userId,
      author: user.name,
    });

    res.status(201).json({
      success: true,
      message: "Memory created successfully",
      data: memory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

Router.get("/", async (req, res) => {
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

Router.get("/:id", async (req, res) => {
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

Router.put("/:id", async (req, res) => {
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

Router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const memory = await Memory.findById(id);

    if (!memory) {
      return res.status(404).json({ message: "Memory not found" });
    }

    const tokenUserId = req.userId;

    if (memory.userId.toString() !== tokenUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Memory.findByIdAndDelete(id);

    res.status(200).json({
      message: "Memory deleted",
      data: memory,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

export default Router;
