const express = require("express");
const { validateBody } = require("../middlewares/validateBody");
const { createReviewSchema, updateReviewSchema } = require("../validators/review.validator");
const auth = require("../middlewares/auth");
const {
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  getReviewStatus
} = require("../controllers/review.controller");

const router = express.Router();

router.get("/prod-review/:productId", listReviews);
router.get("/prod-review/:productId/status", auth(), getReviewStatus);

router.post("/prod-review/:productId/add", auth(), validateBody(createReviewSchema), createReview);
router.patch("/prod-review/:productId/update", auth(), validateBody(updateReviewSchema), updateReview);
router.delete("/prod-review/:productId", auth(), deleteReview);

module.exports = router;
