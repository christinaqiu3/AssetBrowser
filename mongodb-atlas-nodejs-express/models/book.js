const mongodb = require('mongodb');

class Book {
 constructor(title, author) {
   this.title = title;
   this.author = author;
 }

 static findAll() {
   const db = mongodb.connection.db;
   return db.collection('books').find().toArray();
 }

 static create(book) {
   const db = mongodb.connection.db;
   return db.collection('books').insertOne(book);
 }
}

module.exports = Book;