import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  monnifyAccountReference: { type: String },
  monnifyAccountNumber: { type: String },
  monnifyBankName: { type: String },
  unlockedBundles: [{ type: String }],
}, { timestamps: true });
userSchema.methods.setPassword = async function (p) { this.passwordHash = await bcrypt.hash(p, 10); };
userSchema.methods.checkPassword = function (p) { return bcrypt.compare(p, this.passwordHash); };
export default mongoose.models.User || mongoose.model('User', userSchema);
