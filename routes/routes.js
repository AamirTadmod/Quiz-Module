const express = require("express");
const router = express.Router();
const { authMiddleware, adminMiddleware } = require("../middleware/Auth");
const User = require("../models/User");
const { updateProfile } = require("../controllers/userController");
const { getQuizLeaderboard } = require("../controllers/quizController");
const Attempt = require("../models/Attempt");


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
router.get("/quizzes/:id/attempts", authMiddleware, getQuizLeaderboard);

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
    const leaderboard = await Attempt.aggregate([

      {
        $group: {
          _id: "$userId",
          totalCorrect: { $sum: "$score" },
          totalQuestions: {
            $sum: { $ifNull: ["$totalQuestions", 0] }
          },
          attempts: { $sum: 1 }
        }
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      {
        $project: {
          username: "$user.username",
          badges: "$user.badges",
          attempts: 1,
          totalCorrect: 1,
          totalQuestions: 1,
          accuracy: {
            $cond: [
              { $eq: ["$totalQuestions", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalCorrect", "$totalQuestions"] },
                  100
                ]
              }
            ]
          }
        }
      },

      { $sort: { accuracy: -1 } }
    ]);

    res.json({ success: true, leaderboard });

  } catch (error) {
    console.error("LEADERBOARD ERROR:", error);
    res.status(500).json({ success: false });
  }
});



//Update Profile
router.put("/update-profile", authMiddleware, updateProfile);



module.exports = router;
