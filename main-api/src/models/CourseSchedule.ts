import mongoose, { Schema, Document } from "mongoose";

export interface ICourseActivity {
  activityId: string;
  name: string;
  type: string;
  section: number;
  sectionName?: string;
  url?: string;
  dates?: {
    apertura?: string;
    cierre?: string;
  };
  icon?: string;
  description?: string;
}

export interface ICourseSection {
  sectionNumber: number;
  sectionName: string;
  activities: ICourseActivity[];
}

export interface ICourseSchedule extends Document {
  courseId: string;
  userId: mongoose.Types.ObjectId;
  courseName?: string;
  sections: ICourseSection[];
  totalActivities: number;
  lastSynced: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CourseActivitySchema = new Schema(
  {
    activityId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    section: { type: Number, required: true },
    sectionName: { type: String },
    url: { type: String },
    dates: {
      apertura: { type: String },
      cierre: { type: String },
    },
    icon: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const CourseSectionSchema = new Schema(
  {
    sectionNumber: { type: Number, required: true },
    sectionName: { type: String, required: true },
    activities: [CourseActivitySchema],
  },
  { _id: false }
);

const CourseScheduleSchema = new Schema(
  {
    courseId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseName: {
      type: String,
    },
    sections: [CourseSectionSchema],
    totalActivities: {
      type: Number,
      default: 0,
    },
    lastSynced: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas eficientes por usuario y curso
CourseScheduleSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CourseSchedule = mongoose.model<ICourseSchedule>(
  "CourseSchedule",
  CourseScheduleSchema
);
