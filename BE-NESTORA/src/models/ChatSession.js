const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { _id: false, timestamps: true }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [ChatMessageSchema],
    context: {
      preferences: mongoose.Schema.Types.Mixed,
      lastProductsShown: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      userNeeds: String
    },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    lastMessageAt: { type: Date }
  },
  { timestamps: true }
);

// Index để tìm session nhanh hơn
ChatSessionSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
