import express from "express";
import User from "../model/UserModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
import bcrypt from "bcrypt";
import { storage } from "../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import multer from "multer";

const Router = express.Router();

Router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      message: "Users fetched",
      data: users,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});
Router.get("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await User.findById(id);
    res.status(200).json({
      message: "Users fetched",
      data: user,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

// Add this to your user route
Router.put(
  "/:id",
  verifyToken,
  upload.single("profilePicture"),
  async (req, res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;
    const { password, bio, ...inputs } = req.body;

    if (id !== tokenUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let profilePictureUrl;
    try {
      if (req.file) {
        const storageRef = ref(
          storage,
          `profilePictures/${id}/${Date.now()}-${req.file.originalname}`
        );
        await uploadBytes(storageRef, req.file.buffer);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          ...inputs,
          ...(password && { password: await bcrypt.hash(password, 10) }),
          ...(bio && { bio }),
          ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
        },
        { new: true }
      );

      const { password: _, ...user } = updatedUser._doc;
      res.status(200).json({
        message: "User updated",
        data: user,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

Router.delete("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  if (id !== tokenUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    await User.findByIdAndDelete(id);
    res.status(200).json({
      message: "User deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

export default Router;
