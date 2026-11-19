// Custom error class for handling API errors with status code
class cstmerr extends Error {
  constructor(status, message) {
    super();
    this.status = status;
    this.message = message;
  }
}

module.exports = cstmerr;
