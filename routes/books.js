const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif']
// const fs = require('fs') //file system
// const path = require('path')
 
// All Books Route
router.get('/', async (req, res) => {
  let query = Book.find()
  if (req.query.title != null && req.query.title != '') {
    query = query.regex('title', new RegExp(req.query.title, 'i'))
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
    query = query.lte('publishDate', req.query.publishedBefore) //lte meand less than or equal too
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
    query = query.gte('publishDate', req.query.publishedAfter) //gte means greater than or equal too
  }
  try {
    const books = await query.exec() //to get results of executing fucntion
    res.render('books/index', {
      books: books,
      searchOptions: req.query
    })
  } catch {
    res.redirect('/')
  }
})

// New Book Route
router.get('/new', async (req, res) => {
  renderNewPage(res, new Book())
})

// Create Book Route
router.post('/', async (req, res) => {
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate), //convert string to date using a new function we can store
    pageCount: req.body.pageCount,
    description: req.body.description
  })
  saveCover(book, req.body.cover)

  try {
    const newBook = await book.save()
    res.redirect(`books/${newBook.id}`)
  } catch {
    renderNewPage(res, book, true)
  }
})

// Shows Book ROute

router.get('/:id', async (req, res) => {
try {
  const book = await Book.findById(req.params.id).populate('author').exec()
  res.render('books/show', {book: book })
} catch {
  res.redirect('/')
}

})

// Edit Book Route
router.get('/:id/edit', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    renderEditPage(res, book)
  } catch {
    res.redirect('/')
  }
})

// Update Book Route

router.put('/:id', async (req, res) => {
  let book

  try {
    book = await Book.findById(req.params.id)
    book.title = req.body.title
    book.author = req.body.author
    book.publishDate = new Date(req.body.publishDate)
    book.pageCount = req.body.pageCount
    book.description = req.body.description
    if (req.body.cover != null && req.body.cover !== '') {
      saveCover(book, req.body.cover)
    }
    await book.save()
    res.redirect(`/books/${book.id}`)
  } catch {
    if (book != null) {
      renderEditPage(res, book, true)
    } else {
      redirect('/')
    }
  }
})

// Delete Book Page
router.delete('/:id', async (req, res) => {
  let book
  try {
    book = await Book.findById(req.params.id)
    await book.remove()
    res.redirect('/books')
  } catch {
    if (book != null) {
      res.render('books/show', {
        book: book,
        errorMessage: 'Could not remove book'
      })
    } else {
      res.redirect('/')
    }
  }
})

async function renderNewPage(res, book, hasError = false) { //rendering  a New page for book and if selecting author fails it takes you back to book page.
  renderFormPage(res, book, 'new', hasError)
}

async function renderEditPage(res, book, hasError = false) { //rendering  a edit page for book and if selecting author fails it takes you back to book page.
  renderFormPage(res, book, 'edit', hasError)
}

  //rendering  a edit page for book and if selecting author fails it takes you back to book page.
  async function renderFormPage(res, book, form, hasError = false) {
    try {
      const authors = await Author.find({})
      const params = {
        authors: authors,
        book: book
      }
      if (hasError) {
        if (form === 'edit') {
          params.errorMessage = 'Error Updating Book'
        } else {
          params.errorMessage = 'Error Creating Book'
        }
      }
      res.render(`books/${form}`, params)
    } catch {
      res.redirect('/books')
    }
  }

  function saveCover(book, coverEncoded) {
    if (coverEncoded == null) return
    const cover = JSON.parse(coverEncoded) //parsing string as JSON
    if (cover != null && imageMimeTypes.includes(cover.type)) { //to confirm if javascript is bad we can return null to check image tyoe to ensure we have a valid cover
      book.coverImage = new Buffer.from(cover.data, 'base64') //to create a buffer inbetween set of data //learned about base64 data
      book.coverImageType = cover.type  //converting back to image
    }
  }
  
  module.exports = router
