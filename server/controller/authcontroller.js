const User = require('../models/User');
const jwt  = require('jsonwebtoken');

// ── Token Generate ────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ── Register ──────────────────────────────────
async function register(req, res) {
  try {
    const { name, email, password, address, phone, avatar } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const user = await User.create({
      name, email, password, address, phone, avatar
    });

    if (user) {
      return res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id:     user._id,
          name:    user.name,
          email:   user.email,
          role:    user.role,
          address: user.address,
          phone:   user.phone,
          avatar:  user.avatar,
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error("❌ BACKEND ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
}

// ── Login ─────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      return res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id:     user._id,
          name:    user.name,
          email:   user.email,
          role:    user.role,
          address: user.address,
          phone:   user.phone,
          avatar:  user.avatar,
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ── Get Profile ───────────────────────────────
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    return res.status(200).json({
      success: true,
      user: {
        _id:     user._id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
        address: user.address,
        phone:   user.phone,
        avatar:  user.avatar,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ── Get All Users — Admin Only ────────────────
async function getallUsers(req, res) {
  try {
    // Pagination — DSA: Array slicing O(limit)
    const page     = Number(req.query.page)  || 1;
    const limit    = Number(req.query.limit) || 10;
    const skip     = (page - 1) * limit;
    const total    = await User.countDocuments();

    const allUsers = await User.find({})
      .select('-password')
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      users: allUsers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ── Delete User — Admin Only ──────────────────
async function deleteUser(req, res) {
  try {
    // Apna account delete nahi kar sakte
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ── Update Profile ────────────────────────────
async function updateUserProfile(req, res) {
  try {
    const { name, newPassword, currentPassword, phone, address, avatar } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

   
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide current password'
        });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      user.password = newPassword;
      
    }

    // only update fields that are provided in the request body
    if (name)    user.name    = name;
    if (phone)   user.phone   = phone;
    if (address) user.address = address;
    if (avatar)  user.avatar  = avatar;

    await user.save();

    //response se password hata do
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  getallUsers,
  deleteUser,
  updateUserProfile,
};