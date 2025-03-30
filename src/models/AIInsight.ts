import mongoose, { Schema } from 'mongoose';

// Define the schema for AI insights
const AIInsightSchema = new Schema(
  {
    insight: {
      type: String,
      required: true,
    },
    relatedActivities: [{
      type: Schema.Types.ObjectId,
      ref: 'ScreenActivity',
    }],
    insightType: {
      type: String,
      enum: ['productivity', 'automation', 'recommendation', 'reminder'],
      default: 'recommendation',
    },
    priority: {
      type: Number,
      default: 0, // 0 = normal, 1 = important, 2 = critical
    },
    status: {
      type: String,
      enum: ['new', 'viewed', 'implemented', 'dismissed'],
      default: 'new',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
AIInsightSchema.index({ timestamp: -1 });
AIInsightSchema.index({ insightType: 1 });
AIInsightSchema.index({ status: 1 });
AIInsightSchema.index({ priority: -1 });

// Define and export the model if it doesn't already exist
export default mongoose.models.AIInsight ||
  mongoose.model('AIInsight', AIInsightSchema); 