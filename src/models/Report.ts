import mongoose, { Schema, Model } from 'mongoose';

export interface IReport {
  reporter: mongoose.Types.ObjectId;
  reportedUser: mongoose.Types.ObjectId;
  reason: string;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.Report as Model<IReport>) || mongoose.model<IReport>('Report', ReportSchema);
