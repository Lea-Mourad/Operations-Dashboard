function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      error: "Invalid JSON payload",
    });
  }

  return res.status(500).json({
    error:
      error instanceof Error ? error.message : "Internal server error",
  });
}

module.exports = {
  errorHandler,
};
