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
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please enter your password'],
      minlength: 6,
       select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    phone: {
      type: String,
      required: [true, 'Please enter your phone number'],
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
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);