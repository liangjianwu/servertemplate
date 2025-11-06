const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  passwd: { 
    type: String, 
    required: true 
  },
  status: { 
    type: Number, 
    required: true,
    min: -32768,
    max: 32767 // SMALLINT range
  },
  nick: { 
    type: String, 
    maxlength: 255,
    default: null 
  },
  token: { 
    type: String, 
    maxlength: 255,
    default: null 
  },
  expiry_time: { 
    type: Date,
    default: null 
  },
  ua: { 
    type: String, 
    maxlength: 255,
    default: null 
  },
  reset_token: {
    type: String,
    maxlength: 255,
    default: null
  },
  reset_token_expires: {
    type: Date,
    default: null
  },
  ip: { 
    type: String, 
    maxlength: 255,
    default: null 
  }
}, {
  timestamps: false // We'll handle timestamps manually if needed
});

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // one-to-one relationship
  },
  avatar: { 
    type: String, 
    maxlength: 500,
    default: null 
  },
  bio: { 
    type: String, 
    maxlength: 500,
    default: null 
  },
  display: { 
    type: mongoose.Schema.Types.Mixed, // JSON equivalent
    default: null 
  }
});

// Achievement Schema
const achievementSchema = new mongoose.Schema({
  description: { 
    type: String, 
    required: true, 
    maxlength: 255 
  },
  req: { 
    type: mongoose.Schema.Types.Mixed, // JSON equivalent
    required: true 
  }
});

// User Achievements Schema (Junction table)
const userAchievementsSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  achievement_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Achievement', 
    required: true 
  },
  complete_at: { 
    type: Date, 
    required: true 
  }
});

// Create compound index for user_achievements to prevent duplicate achievements per user
userAchievementsSchema.index({ user_id: 1, achievement_id: 1 }, { unique: true });

// Create models
const User = mongoose.model('User', userSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementsSchema);

// Export models
module.exports = {
  User,
  UserProfile,
  Achievement,
  UserAchievement
};

