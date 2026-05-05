

const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/news.controller');
const { validateBody } = require("../middlewares/validateBody");
const { createNewsSchema, createNewsCategorySchema, updateNewsCategorySchema } = require("../validators/news.validator");
const auth = require("../middlewares/auth");

router.get('/get-news', NewsController.listNews);
router.get('/detail/:slug', NewsController.getNewsDetail);
router.get('/categories', NewsController.listNewsCategories);
router.post('/create-news', auth(["admin"]), validateBody(createNewsSchema), NewsController.createNews);
router.put('/update-news/:slug', auth(["admin"]), validateBody(createNewsSchema), NewsController.updateNews);
router.delete('/delete-news/:slug', auth(["admin"]), NewsController.deleteNews);
router.post('/categories', auth(["admin"]), validateBody(createNewsCategorySchema), NewsController.createNewsCategory);
router.put('/categories/:id', auth(["admin"]), validateBody(updateNewsCategorySchema), NewsController.updateNewsCategory);
router.delete('/categories/:id', auth(["admin"]), NewsController.deleteNewsCategory);


module.exports = router;