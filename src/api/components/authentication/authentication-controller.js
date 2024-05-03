const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');

const failedLoginAttempts = {};
const loginAttemptResetTime = 30 * 60 * 1000;

async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    const loginAttempts = failedLoginAttempts[email] || 0;
    if (loginAttempts >= 5) {
      throw errorResponder(
        errorTypes.FORBIDDEN,
        'Too many failed login attempts. Try again later.'
      );
    }

    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      failedLoginAttempts[email] = (failedLoginAttempts[email] || 0) + 1; // Tambahkan percobaan login gagal
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Wrong email or password'
      );
    }

    // Reset failed login attempts count after successful login
    failedLoginAttempts[email] = 0;

    setTimeout(() => {
      delete failedLoginAttempts[email]; // Hapus entri failedLoginAttempts setelah 30 menit
    }, loginAttemptResetTime);

    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
};
