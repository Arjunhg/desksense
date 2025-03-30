import mongoose, { Schema } from 'mongoose';

// Define the schema for screen activity data
const ScreenActivitySchema = new Schema(
  {
    type: {
      type: String,
      enum: ['OCR', 'Audio', 'UI'],
      required: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    appName: String,
    windowName: String,
    browserUrl: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    frameData: String, // Base64 encoded image if available
    processed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create an index on the timestamp field for efficient queries
ScreenActivitySchema.index({ timestamp: -1 });
ScreenActivitySchema.index({ type: 1 });
ScreenActivitySchema.index({ 'content.browserUrl': 1 });

// Define and export the model if it doesn't already exist
export default mongoose.models.ScreenActivity || 
  mongoose.model('ScreenActivity', ScreenActivitySchema); 