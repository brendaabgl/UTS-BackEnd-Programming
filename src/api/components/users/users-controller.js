const usersService = require('./users-service');
const { errorResponder, errorTypes } = require('../../../core/errors');
const { User } = require('../../../models');
const { password } = require('../../../models/piggybank-schema');

/**
 * Handle get list of users request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUsers(request, response, next) {
  try {
    const {
      page_number = 1, //memberi nilai default pada variabel page_number. Jika page_number tidak ada dalam request.query, maka page_number akan diinisialisasi dengan nilai 1.
      page_size = 10, //memberi nilai default pada variabel page_size. Jika page_size tidak ada dalam request.query, maka page_size akan diinisialisasi dengan nilai 10.
      sort = 'email:asc', //memberi nilai default pada variabel sort. Jika sort tidak ada dalam request.query, maka sort akan diinisialisasi dengan nilai 'email:asc'
      search, //  Jika search ada dalam request.query, search akan diisi dengan nilai variabel tersebut. Jika tidak, variabel search akan memiliki nilai undefined
    } = request.query; // mengekstrak nilai-nilai dari objek request.query ke variabel yang sesuai berdasarkan propertinya

    if (page_number && page_size && sort) {
      //memeriksa apakah page_number, page_size, dan sort tersedia dalam query parameters. Jika ketiga parameter ini ada, maka kode di dalam if akan dieksekusi.
      let filter = {}; // Variabel filter diinisialisasi sebagai objek kosong untuk menyimpan filter yang akan digunakan dalam pencarian data pengguna
      if (search) {
        //  memeriksa apakah ada query parameter search,  Jika ada, kode di dalam blok if akan mengekstrak columnName dan searchValue dari nilai search yang dipisahkan oleh ':', dan membuat filter berdasarkan nilai ini
        const [columnName, searchValue] = search.split(':');
        if (columnName && searchValue) {
          filter = {
            [columnName]: { $regex: searchValue, $options: 'i' },
          };
        }
      }

      let sortField = 'email';
      let sortOrder = 1;
      // Variabel sortField dan sortOrder diinisialisasi dengan nilai default untuk pengurutan data berdasarkan kolom email secara ascending
      if (sort) {
        //memeriksa apakah ada query parameter sort. Jika ada, kode di dalam blok if akan mengekstrak field dan order dari nilai sort
        const [field, order] = sort.split(':'); // yang dipisahkan oleh ':', dan menentukan kolom pengurutan serta arah pengurutan
        sortField = field;
        sortOrder = order === 'desc' ? -1 : 1;
      }
      const sortOptions = { [sortField]: sortOrder };
      //  dibuat berdasarkan sortField dan sortOrder yang telah ditentukan, untuk digunakan dalam pengurutan data
      const count = await User.countDocuments(filter);
      // Menghitung jumlah total data pengguna berdasarkan filter yang telah dibuat
      const { total_pages, has_previous_page, has_next_page, users } =
        await getUsersWithPagination(
          filter,
          sortOptions,
          count,
          parseInt(page_number),
          parseInt(page_size)
        );
      // Memanggil fungsi getUsersWithPagination untuk mendapatkan data pengguna dengan pagination berdasarkan filter, opsi pengurutan, jumlah total data, nomor halaman, dan ukuran halaman.
      return response.json({
        //Mengembalikan respons JSON yang berisi informasi tentang halaman, jumlah data, dan data pengguna yang telah dipaginasi
        page_number: parseInt(page_number),
        page_size: parseInt(page_size),
        count,
        total_pages,
        has_previous_page,
        has_next_page,
        data: users,
      });
    } else {
      //Jika kondisi pada awal tidak terpenuhi,  maka kode di dalam blok else akan dijalankan
      //mengambil semua data pengguna tanpa pagination menggunakan usersService.getUsers()
      const users = await usersService.getUsers();
      return response.status(200).json(users);
    }
  } catch (error) {
    //Menangani kesalahan yang mungkin terjadi selama proses pengambilan data
    return next(error);
  }
}

async function getUsersWithPagination(
  filter,
  sortOptions,
  count,
  page_number,
  page_size
) {
  //Menghitung jumlah total halaman
  const total_pages = Math.ceil(count / page_size);
  const has_previous_page = page_number > 1; //Menentukan apakah halaman sebelumnya tersedia
  const has_next_page = page_number < total_pages; //Menentukan apakah halaman berikutnya tersedia
  const skip = (page_number - 1) * page_size; //Menghitung jumlah data yang harus dilewati (skip) berdasarkan nomor halaman saat ini dan ukuran halaman
  const users = await User.find(filter) // Mengambil data pengguna dari database berdasarkan filter yang diberikan
    .sort(sortOptions) // mengurutkan data sesuai opsi pengurutan,
    .skip(skip) // melewati jumlah data yang sesuai dengan halaman saat ini,
    .limit(page_size); // dan membatasi jumlah data yang ditampilkan sesuai dengan ukuran halaman

  return { total_pages, has_previous_page, has_next_page, users };
  // Mengembalikan objek yang berisi informasi tentang jumlah total halaman, ketersediaan halaman sebelumnya dan berikutnya, serta data pengguna yang telah dipaginasi
}

/**
 * Handle get user detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUser(request, response, next) {
  try {
    const user = await usersService.getUser(request.params.id);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createUser(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.createUser(name, email, password);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }

    return response.status(200).json({ name, email });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle update user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateUser(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.updateUser(id, name, email);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteUser(request, response, next) {
  try {
    const id = request.params.id;

    const success = await usersService.deleteUser(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle change user password request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function changePassword(request, response, next) {
  try {
    // Check password confirmation
    if (request.body.password_new !== request.body.password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Check old password
    if (
      !(await usersService.checkPassword(
        request.params.id,
        request.body.password_old
      ))
    ) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong password');
    }

    const changeSuccess = await usersService.changePassword(
      request.params.id,
      request.body.password_new
    );

    if (!changeSuccess) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to change password'
      );
    }

    return response.status(200).json({ id: request.params.id });
  } catch (error) {
    return next(error);
  }
}
//membuat akun piggybank
async function createuserpiggybank(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;
    const balance = request.body.balance;
    const ktp = request.body.ktp;

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.createUserpiggybank(
      name,
      email,
      password,
      balance,
      ktp
    );
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }

    return response.status(200).json({ name, email });
  } catch (error) {
    return next(error);
  }
}

async function getktpforpiggybank(request, response, next) {
  try {
    const email = request.body.email;

    const userData = await usersService.getKTPForPiggyBank(email);

    if (!userData) {
      return response
        .status(404)
        .json({ message: 'User not found with this email' });
    }

    return response.status(200).json(userData); // Mengembalikan userData yang berisi name dan ktp
  } catch (error) {
    return next(error);
  }
}
async function updatektppiggybank(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;
    const ktp = request.body.ktp_baru;

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.updatektppiggybank(id, name, email, ktp); // Memanggil dengan parameter yang benar
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}
async function deleteuserpiggybank(request, response, next) {
  try {
    const id = request.params.id;

    const success = await usersService.deleteuserpiggybank(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  createuserpiggybank,
  getktpforpiggybank,
  updatektppiggybank,
  deleteuserpiggybank,
};
