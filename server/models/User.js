const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      lowercase: true,
      trim: true,
    // Purani regex 4+ letter TLD (.store, .info) aur + wale emails reject karti thi
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please add a valid email']
    },
    // Google se aaye users ka password nahi hota
    password: {
      type: String,
      required: [function () { return !this.googleId; }, 'Please enter your password'],
      minlength: 6,
       select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Forgot password: token ka sirf SHA-256 hash DB mein, asli token email mein
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    // Google users ke paas phone nahi hota; profile ya checkout par baad mein dete hain
    phone: {
      type: String,
      required: [function () { return !this.googleId; }, 'Please enter your phone number'],
      trim: true,
    },
    address: {
      street: String,
      city:   String,
      zip:    String,
    },
    avatar: {
      type: String,
      default: 'uploads/default_profile.png',
    },
  },
  { timestamps: true }
);

//  password hashing before save
UserSchema.pre('save', async function () {
  try {
    // 1. Agar password tabdeel nahi hua, toh yahin se return ho jao
    if (!this.isModified('password')) return;

    // 2. Salt generate karo
    const salt = await bcrypt.genSalt(10);

    // 3. Password ko hash karke save karo
    this.password = await bcrypt.hash(this.password, salt);

    // ✅ Koi next() yahan nahi likhna!
  } catch (error) {
    console.error("❌ ERROR IN PRE-SAVE HOOK:", error);
    throw error; // Yeh error ko direct controller ke catch block mein bhej dega
  }
});
// password compare..
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Google-only account
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);