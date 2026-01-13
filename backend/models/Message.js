import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
      index: true, // Index for efficient queries
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: function() {
        // Content is required for text messages
        return this.type === 'text';
      },
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'file'],
      default: 'text',
    },
    fileUrl: {
      type: String,
      required: function() {
        // fileUrl is required for file messages
        return this.type === 'file';
      },
      trim: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for efficient queries by gigId and createdAt
messageSchema.index({ gigId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);

