import mongoose from "mongoose";

const connectDB = async () => {
  const mongoAtlasUri = process.env.DB_CONN;
  if (!mongoAtlasUri) {
    throw new Error("DB_CONN is not configured");
  }

  await mongoose.connect(mongoAtlasUri);
  console.log("Database connection established");
};

export default connectDB;
