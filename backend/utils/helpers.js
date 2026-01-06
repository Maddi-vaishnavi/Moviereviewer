const helpers = {
  // Format date for consistent display
  formatDate: (date) => {
    return new Date(date).toLocaleString();
  },

  // Sanitize user input
  sanitizeInput: (str) => {
    return str.trim().replace(/[<>]/g, '');
  },

  // Calculate pagination info
  getPaginationInfo: (page, limit, total) => {
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const totalPages = Math.ceil(total / itemsPerPage);
    const skip = (currentPage - 1) * itemsPerPage;
    
    return {
      currentPage,
      totalPages,
      total,
      skip,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  },

  // Generate unique user ID (if needed)
  generateUserId: () => {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
};

module.exports = helpers;