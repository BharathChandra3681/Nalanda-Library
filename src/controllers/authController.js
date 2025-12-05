const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.success(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me
  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user._id);
      return ApiResponse.success(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users (admin only)
  async getAllUsers(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await authService.getAllUsers({ page, limit });
      return ApiResponse.paginated(res, result.users, result.pagination, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/users/:id/role (admin only)
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['admin', 'member'].includes(role)) {
        return ApiResponse.error(res, 'Valid role (admin/member) is required', 400);
      }

      const user = await authService.updateUserRole(id, role);
      return ApiResponse.success(res, { user }, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:id (admin only)
  async deactivateUser(req, res, next) {
    try {
      const { id } = req.params;
      
      // Prevent self-deactivation
      if (id === req.user._id.toString()) {
        return ApiResponse.error(res, 'Cannot deactivate your own account', 400);
      }

      const result = await authService.deactivateUser(id);
      return ApiResponse.success(res, result, 'User deactivated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();