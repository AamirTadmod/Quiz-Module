const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");

// ✅
exports.register = async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, error: "Please fill all the fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Password and Confirm Password should be same",
      });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: "Email is already registered, Please log in",
      });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        error: "Username already exists",
      });
    }

    const hashedPasssword = await bcrypt.hash(password, 10);

    // 🔒 Force role to "user"
    const user = await User.create({
      username,
      email,
      password: hashedPasssword,
      role: "user",
    });

    return res.status(200).json({
      success: true,
      message: "User created successfully",
    });

  } catch (error) {
    console.log("ERROR WHILE REGISTERING THE NEW USER : ", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};


// ✅
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Please fill all the fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // create cookie and send res
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    return res.cookie("token", token, options).status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          attemptedQuizzes: user?.attemptedQuizes || [],
        },
      },
    });
  } catch (error) {
    console.log("ERROR WHILE LOGGIN IN THE USER : ", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: "Username and Email are required",
      });
    }

    // Check if email already exists
    const emailExists = await User.findOne({
      email,
      _id: { $ne: userId },
    });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: "Email already in use",
      });
    }

    // Check if username already exists
    const usernameExists = await User.findOne({
      username,
      _id: { $ne: userId },
    });

    if (usernameExists) {
      return res.status(400).json({
        success: false,
        error: "Username already taken",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        attemptedQuizzes: updatedUser?.attemptedQuizes || [],
      },
    });

  } catch (error) {
    console.log("ERROR WHILE UPDATING PROFILE:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
