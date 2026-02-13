const mongoose = require("mongoose");

exports.connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error occurred while connecting to DB");
    console.error(error);
  }
};
