const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { name, email, password, role, age, gender } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let status = 'pending';
    if (role === 'patient') {
      status = 'approved';
    }

    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      role,
      age,
      gender,
      status
    });

    res.status(201).json({
      message: `User registered successfully as ${role}`,
      user_id: user.user_id,
      status: user.status
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== 'patient') {
      if (user.status === 'pending')
        return res.status(403).json({ message: "Account is pending admin approval" });
      if (user.status === 'rejected')
        return res.status(403).json({ message: "Account has been rejected" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    res.json({
      message: `Password reset link generated`,
      resetLink,
      token: resetToken
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: "Token and newPassword required" });

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = await User.findByPk(decoded.user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedPassword;
    await user.save();

    res.json({ message: "Password has been reset successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['user_id', 'name', 'email', 'role', 'age', 'gender', 'picture', 'status']
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({
      where: { email },
      attributes: ['user_id', 'name', 'email', 'role', 'age', 'gender', 'picture', 'status']
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.destroy({ where: { user_id: id } });
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  const requester = req.user;
  let user;

  try {
    if (requester.role === 'admin' && req.params.id) {
      user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
    } else {
      user = await User.findByPk(requester.user_id);
      if (!user) return res.status(404).json({ message: "User not found" });
    }

    const { name, age, gender, picture, role, verified, email, status } = req.body;

    if (name) user.name = name;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (picture) user.picture = picture;

    if (requester.role === 'admin') {
      if (role) user.role = role;
      if (verified !== undefined) user.verified = verified;
      if (status) user.status = status;
    }

    if (email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists && emailExists.user_id !== user.user_id) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    await user.save();
    res.json({ message: "User updated successfully", updatedUser: user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserByEmail,
  deleteUser,
  updateUser
};
