const express = require("express");

const {
  listReviews,
  reprocessReview,
  resolveReview,
} = require("../controllers/reviews.controller");
const { validateJson } = require("../middleware/validateJson");

const router = express.Router();

router.get("/reviews", listReviews);
router.post("/reviews/:id/resolve", validateJson, resolveReview);
router.post("/reviews/:id/reprocess", validateJson, reprocessReview);

module.exports = router;
