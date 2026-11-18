
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/leave-management")
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((error) => console.log("MongoDB Connection Error:", error.message));

// Leave Schema
const leaveSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  leaveType: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: "Pending" }
}, { timestamps: true });

const Leave = mongoose.model("Leave", leaveSchema);

// Home Route
app.get("/", (req, res) => {
  res.send("Leave Management API is Running!");
});

// Get all leave requests
app.get("/leaves", async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch leave requests" });
  }
});

// Apply for leave
app.post("/leaves", async (req, res) => {
  try {
    const { employeeName, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeName || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const leave = new Leave({
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason
    });

    await leave.save();
    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: "Unable to apply for leave" });
  }
});

// Update leave status
app.patch("/leaves/:id", async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: "Unable to update leave request" });
  }
});

// Delete leave request
app.delete("/leaves/:id", async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json({ message: "Leave request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete leave request" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
