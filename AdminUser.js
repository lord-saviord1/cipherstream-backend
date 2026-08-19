import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Separate from User/Business — this is YOU and your teammate, not customers.
const adminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

adminUserSchema.methods.setPassword = async function (p) { this.passwordHash = await bcrypt.hash(p, 10); };
adminUserSchema.methods.checkPassword = function (p) { return bcrypt.compare(p, this.passwordHash); };

export default mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);
