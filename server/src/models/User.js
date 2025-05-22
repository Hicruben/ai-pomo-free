const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
    },
    activeTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    settings: {
      workTime: {
        type: Number,
        default: 25,
      },
      shortBreakTime: {
        type: Number,
        default: 5,
      },
      longBreakTime: {
        type: Number,
        default: 15,
      },
      longBreakInterval: {
        type: Number,
        default: 4,
      },
      autoStartNextSession: {
        type: Boolean,
        default: false,
      },
      tickingSound: {
        type: Boolean,
        default: false,
      },
      volume: {
        type: Number,
        default: 50,
      },
      selectedSound: {
        type: String,
        default: 'bell',
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'yearly', 'lifetime'],
        default: 'free',
      },
      expiryDate: {
        type: Date,
      },
      active: {
        type: Boolean,
        default: true,
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    subscriptionStatus: {
      type: String,
      enum: ['free', 'premium', 'expired'],
      default: 'free',
    },
    maxProjects: {
      type: Number,
      default: 3, // Default limit for free users
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
