const express = require("express");

const {
  listReviews,
  resolveReview,
} = require("../controllers/reviews.controller");
const { validateJson } = require("../middleware/validateJson");

const router = express.Router();

router.get("/reviews", listReviews);
router.post("/reviews/:id/resolve", validateJson, resolveReview);

module.exports = router;
