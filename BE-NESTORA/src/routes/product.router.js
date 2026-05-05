

const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { validateBody } = require("../middlewares/validateBody");
const { createProductSchema } = require("../validators/product.validator");

const auth = require("../middlewares/auth");

router.post("/create-product", auth(["admin"]), validateBody(createProductSchema), productController.createProduct);
router.get("/get-products", productController.getAllProducts);
router.get("/product-detail/:id", productController.getProductById);
router.put("/update-product/:id", auth(["admin"]), validateBody(createProductSchema), productController.updateProduct);
router.delete("/delete-product/:id", auth(["admin"]), productController.deleteProduct);

module.exports = router;