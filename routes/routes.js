const express = require("express");
const router = express.Router();
const { authMiddleware, adminMiddleware } = require("../middleware/Auth");
const User = require("../models/User");

// Import Controllers
const {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getAllQuizzes,
  getQuizById,
  attemptQuiz,
  getUserAttempts,
  getAdminQuizes,
  getQuizAttempts,
} = require("../controllers/quizController");

const {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuizQuestions,
} = require("../controllers/questionController");

const { login, register } = require("../controllers/userController");

// User Authentication
router.post("/login", login);
router.post("/register", register);

// Quiz routes
router.get("/admin-quizzes", authMiddleware, adminMiddleware, getAdminQuizes);
router.get("/attempts/:id", authMiddleware, adminMiddleware, getQuizAttempts);
router.post("/quizzes", authMiddleware, adminMiddleware, createQuiz);
router.put("/quizzes/:id", authMiddleware, adminMiddleware, updateQuiz);
router.delete("/quizzes/:id", authMiddleware, adminMiddleware, deleteQuiz);

// question routes
router.get("/questions/:id", authMiddleware, getQuizQuestions);
router.post("/questions", authMiddleware, adminMiddleware, createQuestion);
router.put("/questions/:id", authMiddleware, adminMiddleware, updateQuestion);
router.delete(
  "/questions/:id",
  authMiddleware,
  adminMiddleware,
  deleteQuestion
);

// data routes
router.get("/quizzes", authMiddleware, getAllQuizzes);
router.get("/quizzes/:id", authMiddleware, getQuizById);
router.post("/quizzes/:id/attempt", authMiddleware, attemptQuiz);
router.get("/attempts", authMiddleware, getUserAttempts);

// 🏆 Leaderboard Route
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("username points attemptedQuizes badges")
      .sort({ points: -1 });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      points: user.points,
      quizzesCompleted: user.attemptedQuizes.length,
      badges: user.badges,
    }));

    res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
});


module.exports = router;
