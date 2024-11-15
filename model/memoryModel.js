import express from "express";
import mongoose from "mongoose";

const MemorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Memory = mongoose.model("Memory", MemorySchema);

export default Memory;
