const mongoose = require('mongoose');
const User  = require('../models/User');
const Order = require('../models/Order');
const Cart  = require('../models/Cart');
const jwt   = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { parsePagination } = require('../utils/query');
const { sendMail } = require('../utils/mailer');

const googleClient = new OAuth2Client();

// Client ko jo user object jata hai (password ya googleId kabhi nahi).
// hasPassword: Google-only account ke liye false, taake UI password section chhupa sake.
const userPayload = (user) => ({
  _id:     user._id,
  name:    user.name,
  email:   user.email,
  role:    user.role,
  address: user.address,
  phone:   user.phone,
  avatar:  user.avatar,
  hasPassword: Boolean(user.password),
});

// Reset link ka base URL: CLIENT_URL ka pehla origin
const clientBaseUrl = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

const RESET_MINUTES = 15;

// ── Token Generate ────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    // Env se badla ja sakta hai; default 7 din (pehle 30 din tha)
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ── Register ──────────────────────────────────
async function register(req, res) {
  try {
    const { name, email, password, address, phone, avatar } = req.body;

    // email/password string hi hon (object aaye to query operator ban sakta hai)
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

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
        user: userPayload(user)
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    // Galat email/phone jaisi validation errors 400 hain, server error nahi
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
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

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    // Sirf Google se bana account: password se login nahi ho sakta
    if (user && !user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google sign-in. Please use "Continue with Google".'
      });
    }

    if (user && (await user.matchPassword(password))) {
      return res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: userPayload(user)
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

// ── Google Login ──────────────────────────────
// Client Google se ID token (credential) leta hai, hum yahan verify karke
// wahi JWT dete hain jo normal login deta hai.
async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (typeof credential !== 'string' || !credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ success: false, message: 'Google sign-in is not configured' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(400).json({ success: false, message: 'Google sign-in failed. Please try again.' });
    }

    if (!payload?.email || !payload.email_verified) {
      return res.status(400).json({ success: false, message: 'Your Google email is not verified' });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub }).select('+password');

    if (!user) {
      user = await User.findOne({ email }).select('+password');
      if (user) {
        // Is email ka account pehle se hai: Google ne email verify ki hai, to link kar do
        user.googleId = payload.sub;
        await user.save();
      } else {
        user = await User.create({
          name: payload.name || email.split('@')[0],
          email,
          googleId: payload.sub,
        });
      }
    }

    return res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: userPayload(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Account already exists' });
    }
    console.error('Google login error:', error);
    return res.status(500).json({ success: false, message: 'Google sign-in failed' });
  }
}

// ── Forgot Password ───────────────────────────
// Hamesha ek hi jawab dete hain (email maujood ho ya na ho), taake koi
// emails guess na kar sake.
async function forgotPassword(req, res) {
  const generic = {
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  };

  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) return res.status(200).json(generic);

    // Google-only account: reset nahi, bas bata do ke Google se login karein
    if (!user.password) {
      try {
        await sendMail({
          to: user.email,
          subject: 'Bazaaro sign-in',
          text: 'Your Bazaaro account uses Google sign-in, so it has no password to reset. Please use "Continue with Google" on the login page.',
        });
      } catch (err) {
        console.error('Forgot-password mail error:', err.message);
      }
      return res.status(200).json(generic);
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken   = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
    await user.save({ validateModifiedOnly: true });

    const link = `${clientBaseUrl()}/reset-password/${token}`;
    try {
      await sendMail({
        to: user.email,
        subject: 'Reset your Bazaaro password',
        text:
          `Hi ${user.name},\n\n` +
          `Use this link to set a new password (valid for ${RESET_MINUTES} minutes):\n${link}\n\n` +
          `If you did not ask for this, you can ignore this email.`,
        html:
          `<p>Hi ${String(user.name).replace(/[<>&]/g, '')},</p>` +
          `<p>Use the button below to set a new password. The link is valid for ${RESET_MINUTES} minutes.</p>` +
          `<p><a href="${link}" style="background:#1B4332;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>` +
          `<p>If the button does not work, copy this link:<br>${link}</p>` +
          `<p>If you did not ask for this, you can ignore this email.</p>`,
      });
    } catch (err) {
      // Mail na jaye to token bekar hai, hata do
      console.error('Forgot-password mail error:', err.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateModifiedOnly: true });
    }

    return res.status(200).json(generic);
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong, please try again' });
  }
}

// ── Reset Password ────────────────────────────
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid or has expired. Please request a new one.',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated. You can now sign in.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong, please try again' });
  }
}

// ── Get Profile ───────────────────────────────
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    return res.status(200).json({
      success: true,
      user: userPayload(user)
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
    const { page, limit, skip } = parsePagination(req.query);
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
// Orders sales history hain (revenue, analytics), isliye delete nahi hote.
// Active orders (processing/shipped) hon to delete roka jata hai, warna wo
// bina customer ke atak jate hain. Cart user ke saath hata di jati hai.
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Apna account delete nahi kar sakte
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const activeOrders = await Order.countDocuments({
      user: id,
      orderStatus: { $in: ['processing', 'shipped'] }
    });
    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `User has ${activeOrders} active order(s). Deliver or cancel them first.`
      });
    }

    await Cart.deleteOne({ user: id });
    await user.deleteOne();

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
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'This account uses Google sign-in and has no password'
        });
      }
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
    updatedUser.hasPassword = Boolean(user.password);
    delete updatedUser.password;
    delete updatedUser.googleId;

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
  googleLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  getallUsers,
  deleteUser,
  updateUserProfile,
};