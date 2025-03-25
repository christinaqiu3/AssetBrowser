const express = require('express');
const router = express.Router();
const Book = require('../models/book');

router.get('/', async (req, res) => {
 try {
   const books = await Book.findAll();
   res.json(books);
 } catch (error) {
   res.status(500).json({ error: 'An error occurred' });
 }
});

router.post('/', async (req, res) => {
 const book = new Book(req.body.title, req.body.author);

 try {
   const result = await Book.create(book);
   res.json(result.ops[0]);
 } catch (error) {
   res.status(500).json({ error: 'An error occurred' });
 }
});

module.exports = router;