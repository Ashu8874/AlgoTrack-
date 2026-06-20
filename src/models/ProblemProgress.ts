import mongoose from 'mongoose'

const { Schema } = mongoose

const ProblemProgressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, required: true, index: true },
    solved: { type: Boolean, default: false },
    autoDetected: { type: Boolean, default: false },
  },
  { timestamps: true }
)

ProblemProgressSchema.index({ user: 1, slug: 1 }, { unique: true })

const ProblemProgress = (mongoose.models.ProblemProgress as mongoose.Model<unknown>) || mongoose.model('ProblemProgress', ProblemProgressSchema)

export default ProblemProgress
