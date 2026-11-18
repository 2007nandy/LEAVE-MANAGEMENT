
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/leave-management"
  )
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((error) =>
    console.error("MongoDB Connection Error:", error)
  );

// Leave Schema
const leaveSchema = new mongoose.Schema(
  {
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    leaveType: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Leave = mongoose.model("Leave", leaveSchema);

// Home Route
app.get("/", (req, res) => {
  res.send("Leave Management API is Running!");
});

// Get All Leave Requests
app.get("/leaves", async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    console.error("Fetch Leaves Error:", error);
    res.status(500).json({
      message: error.message || "Unable to fetch leave requests",
    });
  }
});

// Apply for Leave
app.post("/leaves", async (req, res) => {
  try {
    const {
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason,
    } = req.body;

    if (
      !employeeName?.trim() ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !reason?.trim()
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        message: "End date must be on or after the start date",
      });
    }

    const leave = new Leave({
      employeeName: employeeName.trim(),
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
    });

    await leave.save();

    console.log("Leave Applied Successfully:", leave._id);

    res.status(201).json({
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    console.error("Apply Leave Error:", error);

    res.status(500).json({
      message: error.message || "Unable to apply for leave",
    });
  }
});

// Update Leave Status
app.patch("/leaves/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid leave status",
      });
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after", runValidators: true }
    );

    if (!leave) {
      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    res.status(200).json(leave);
  } catch (error) {
    console.error("Update Leave Error:", error);

    res.status(500).json({
      message: error.message || "Unable to update leave request",
    });
  }
});

// Delete Leave Request
app.delete("/leaves/:id", async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);

    if (!leave) {
      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    res.status(200).json({
      message: "Leave request deleted successfully",
    });
  } catch (error) {
    console.error("Delete Leave Error:", error);

    res.status(500).json({
      message: error.message || "Unable to delete leave request",
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
