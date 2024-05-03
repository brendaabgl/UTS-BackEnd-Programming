const { User, piggybank } = require('../../../models');

/**
 * Get a list of users
 * @returns {Promise}
 */
async function getUsers() {
  return User.find({});
}

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function getUser(id) {
  return User.findById(id);
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Hashed password
 * @returns {Promise}
 */
async function createUser(name, email, password) {
  return User.create({
    name,
    email,
    password,
  });
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {Promise}
 */
async function updateUser(id, name, email) {
  return User.updateOne(
    {
      _id: id,
    },
    {
      $set: {
        name,
        email,
      },
    }
  );
}

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function deleteUser(id) {
  return User.deleteOne({ _id: id });
}

/**
 * Get user by email to prevent duplicate email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email });
}

/**
 * Update user password
 * @param {string} id - User ID
 * @param {string} password - New hashed password
 * @returns {Promise}
 */
async function changePassword(id, password) {
  return User.updateOne({ _id: id }, { $set: { password } });
}
async function createuserpiggybank(name, email, password, balance, ktp) {
  return piggybank.create({
    name,
    email,
    password,
    balance,
    ktp,
  });
}

async function getktpforpiggybank(id) {
  return piggybank.findById(id);
}
async function getktpbyemail(email) {
  return piggybank.findOne({ email });
}
async function updatektppiggybank(id, name, email, ktp) {
  const user = await piggybank.findById(id); // Menggunakan model piggybank
  if (!user) {
    return null;
  }

  try {
    await piggybank.updateOne({ _id: id }, { $set: { name, email, ktp } });
  } catch (err) {
    return null;
  }

  return true;
}
async function deleteuserpiggybank(id) {
  return piggybank.deleteOne({ _id: id });
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  changePassword,
  createuserpiggybank,
  getktpforpiggybank,
  getktpbyemail,
  updatektppiggybank,
  deleteuserpiggybank,
};
