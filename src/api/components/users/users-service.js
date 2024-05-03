const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');

/**
 * Get list of users
 * @returns {Array}
 */
async function getUsers() {
  const users = await usersRepository.getUsers();

  const results = [];
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    results.push({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  return results;
}

async function getUsersWithPagination(
  page_number = 1,
  page_size = 10,
  sort = 'email:asc',
  search
) {
  const filter = createFilter(search);
  const sortOptions = createSortOptions(sort);
  const { total_pages, users } = await getUsersData(
    page_number,
    page_size,
    filter,
    sortOptions
  );

  return {
    page_number: parseInt(page_number),
    page_size: parseInt(page_size),
    count: users.length,
    total_pages,
    has_previous_page: page_number > 1,
    has_next_page: page_number < total_pages,
    data: users,
  };
}

function createFilter(search) {
  let filter = {};
  if (search) {
    filter = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };
  }
  return filter;
}

function createSortOptions(sort) {
  let sortField = 'email';
  let sortOrder = 1;
  if (sort) {
    const [field, order] = sort.split(':');
    sortField = field;
    sortOrder = order === 'desc' ? -1 : 1;
  }
  return { [sortField]: sortOrder };
}

async function getUsersData(page_number, page_size, filter, sortOptions) {
  const total_count = await usersRepository.getUserCount(filter);
  const total_pages = Math.ceil(total_count / page_size);
  const skip = (page_number - 1) * page_size;
  const users = await usersRepository.getUsers(
    page_size,
    skip,
    filter,
    sortOptions
  );

  return { total_pages, users };
}

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);

  const changeSuccess = await usersRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}
async function createUserpiggybank(name, email, password, balance, ktp) {
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createuserpiggybank(
      name,
      email,
      hashedPassword,
      balance,
      ktp
    );
  } catch (err) {
    return null;
  }

  return true;
}

async function getKTPForPiggyBank(email) {
  try {
    const user = await usersRepository.getktpbyemail(email);

    if (!user) {
      throw new Error('Invalid email');
    }

    return {
      name: user.name, // Mengambil name juga dari user
      ktp: user.ktp, //mengambil no ktp dari user
    };
  } catch (error) {
    throw error;
  }
}
async function updatektppiggybank(id, name, email, ktp) {
  const user = await usersRepository.updatektppiggybank(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updatektppiggybank(id, name, email, ktp);
  } catch (err) {
    return null;
  }

  return true;
}
async function deleteuserpiggybank(id) {
  const user = await usersRepository.deleteuserpiggybank(id);

  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteuserpiggybank(id);
  } catch (err) {
    return null;
  }
  return true;
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
  createUserpiggybank,
  getKTPForPiggyBank,
  updatektppiggybank,
  deleteuserpiggybank,
};
