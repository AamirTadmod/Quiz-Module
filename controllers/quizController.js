const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const User = require("../models/User");
const mongoose = require("mongoose");


// ✅
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, timer } = req.body;
    const user = req.user;

    if (!title || !description || !timer) {
      return res.status(400).json({
        success: false,
        error: "Please provide all the required fields",
      });
    }

    const quiz = await Quiz.create({
      title,
      description,
      timer,
      createdBy: user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: quiz,
    });
  } catch (e) {
    console.log("ERROR CREATING QUIZ: ", e);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ✅
exports.updateQuiz = async (req, res) => {
  try {
    const { title, description, timer } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    quiz.title = title;
    quiz.description = description;
    quiz.timer = timer;

    await quiz.save();

    return res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: quiz,
    });
  } catch (e) {
    console.log("ERROR UPDATING QUIZ : ", e);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ✅
exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    const questions = await Question.find({ quiz: quizId });

    for (const question of questions) {
      await Question.findByIdAndDelete(question._id);
    }

    await Quiz.findByIdAndDelete(quizId);

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (e) {
    console.log("ERROR DELETING QUIZ : ", e);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ✅
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate("createdBy", "username email");
    return res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (e) {
    console.log("ERROR GETTING QUIZZES : ", e);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ✅
exports.getQuizById = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId).populate(
      "createdBy",
      "username email"
    );
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }
    return res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (e) {
    console.log("ERROR GETTING QUIZ : ", e);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ✅
exports.attemptQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizId, answers } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    const questions = await Question.find({ quizId });

    let score = 0;
    const answersArray = [];

    for (const question of questions) {
      const userAnswer = answers.find(
        (ans) => ans.questionId === question._id.toString()
      );

      if (userAnswer) {
        const selectedOption = question.options.id(userAnswer.selectedOption);

        if (selectedOption?.isCorrect) {
          score += 1;
        }

        answersArray.push({
          questionId: question._id,
          selectedOption: userAnswer.selectedOption,
        });
      }
    }

    const totalQuestions = questions.length;
    const newPoints = score * 10 + 5;

    const user = await User.findById(userId);

    // 🔍 CHECK IF USER ALREADY ATTEMPTED THIS QUIZ
    const existingAttempt = await Attempt.findOne({ userId, quizId });

    if (existingAttempt) {
      // REMOVE OLD POINTS
      const oldPoints = existingAttempt.score * 10 + 5;

      user.points = Math.max(0, user.points - oldPoints);
      user.points += newPoints;

      // UPDATE ATTEMPT
      existingAttempt.score = score;
      existingAttempt.totalQuestions = totalQuestions;
      existingAttempt.answers = answersArray;
      existingAttempt.completedAt = Date.now();

      await existingAttempt.save();

    } else {
      // CREATE NEW ATTEMPT
      await Attempt.create({
        userId,
        quizId,
        score,
        totalQuestions,
        answers: answersArray,
      });

      user.points += newPoints;

      if (!user.attemptedQuizes.includes(quizId)) {
        user.attemptedQuizes.push(quizId);
      }
    }

    // 🏅 BADGE LOGIC
    if (user.points >= 50 && !user.badges.includes("IPR Beginner")) {
      user.badges.push("IPR Beginner");
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      score,
      totalPoints: user.points,
    });

  } catch (e) {
    console.error("ERROR ATTEMPTING QUIZ:", e.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};




// ✅
exports.getUserAttempts = async (req, res) => {
  try {
    const userId = req.user.id; 

    const attempts = await Attempt.find({ userId }).populate(
      "quizId",
      "title description"
    );

    return res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (e) {
    console.error("ERROR FETCHING USER ATTEMPTS:", e.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ✅
exports.getAdminQuizes = async (req, res) => {
  try {
    const userId = req.user.id;

    const quizzes = await Quiz.find({ createdBy: userId });

    return res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (e) {
    console.error("ERROR FETCHING ADMIN QUIZZES:", e.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ✅
exports.getQuizAttempts = async (req, res) => {
  try {
    const quizId = req.params.id;
    const attempts = await Attempt.find({ quizId }).populate(
      "userId score",
      "username"
    );
    return res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (e) {
    console.error("ERROR FETCHING QUIZ ATTEMPTS:", e.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getQuizLeaderboard = async (req, res) => {
  try {
    const quizId = req.params.id;

    const leaderboard = await Attempt.aggregate([
      { $match: { quizId: new mongoose.Types.ObjectId(quizId) } },

      {
        $sort: { score: -1 }
      },

      {
        $group: {
          _id: "$userId",
          bestScore: { $first: "$score" }
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
          score: "$bestScore"
        }
      },

      { $sort: { score: -1 } }
    ]);

    res.json({ success: true, data: leaderboard });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
