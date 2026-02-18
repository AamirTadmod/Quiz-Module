require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");


const routes = require("./routes/routes");
const cookieParser = require("cookie-parser");

const database = require("./config/database");

const PORT = process.env.PORT || 4000;

// connect to db
database.connectToDB();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://quizzy-frontend-c27i.onrender.com"],
    credentials: true,
  })
);

console.log("CONNECTED TO DB:", process.env.MONGO_URI);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Your server is up and running...",
  });
});

app.use("/api/v1/", routes);

// activate server
app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
