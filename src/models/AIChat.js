import mongoose from "mongoose";

const aiChatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [
      {
        sender: { type: String, enum: ["user", "ai"], required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const AIChat = mongoose.model("AIChat", aiChatSchema);
export default AIChat;
