const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = (req, res, next) => {

  let token = null;

  // 1️⃣ Check cookie first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2️⃣ Check Authorization header
  else if (req.header("Authorization")) {
    token = req.header("Authorization").replace("Bearer ", "");
  }

  // 3️⃣ If still no token → return 401 safely
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "Invalid token.",
    });
  }
};


const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).send({ error: "Access denied." });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};
