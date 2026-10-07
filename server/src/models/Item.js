import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['shayari', 'documents', 'photos', 'notes'],
      required: true,
    },

    title: {
      type: String,
      default: '',
      maxlength: 160,
    },

    content: {
      type: String,
      default: '',
    },

    description: {
      type: String,
      default: '',
    },

    category: {
      type: String,
      default: '',
    },

    filename: String,
    mimeType: String,
    size: {
      type: Number,
      default: 0,
    },

    gridfsId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    favorite: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Item', itemSchema);