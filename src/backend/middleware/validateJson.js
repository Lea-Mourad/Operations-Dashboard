function validateJson(req, res, next) {
  if (req.method !== "POST") {
    return next();
  }

  if (!req.is("application/json")) {
    return res.status(415).json({
      error: "Content-Type must be application/json",
    });
  }

  if (req.body === undefined) {
    return res.status(400).json({
      error: "Invalid JSON payload",
    });
  }

  return next();
}

module.exports = {
  validateJson,
};
