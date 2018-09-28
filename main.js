// Load libraries and set configuration required
require('dotenv').config()
const express = require('express')
const mysql = require('mysql')
const path = require('path')
const multer  = require('multer')

// define API queries
const sqlGetBookList = 'select id, title, author_firstname, author_lastname, cover_thumbnail from books where upper(author_firstname) like ? || upper(author_lastname) like ? || upper(title) like ?' 
const sqlGetBook = 'SELECT id, author_lastname, author_firstname, title, cover_thumbnail FROM books WHERE id = ?'

// define db connection pool
var pool = mysql.createPool({
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME,
    connectionLimit : process.env.DB_CONNLIMIT,
    debug: true
})

// define upload cfg
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, 'thumbnails'))
    },

    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }   
  })

const upload = multer({ storage: storage }).single('filename')

// instantiate express
const APP_PORT  = process.env.APP_PORT
const app = express()

// API routes
app.get('/books', (req, res) => {

    let finalCriteriaFromType = ['%%','%%','%%'];
    if (!(typeof(req.query.title) === 'undefined' && typeof(req.query.author) === 'undefined')) {
        console.log('Search with Keywords')
        let author = (typeof(req.query.author) === 'undefined' ? '' : req.query.author)
        let title = (typeof(req.query.title) === 'undefined' ? '' : req.query.title)
        finalCriteriaFromType = ['%' + author.toUpperCase() + '%', '%' + author.toUpperCase() + '%', '%' +title.toUpperCase() + '%'];
    } else {
        console.log('default view')
    }

    let sortBy = (typeof(req.query.sortBy) === 'undefined' ? 'title' : req.query.sortBy)  
    let sortOrder =  (typeof(req.query.sortOrder) === 'undefined' ? 'ASC' : req.query.sortOrder) 
    let offset = (typeof(req.query.offset) === 'undefined' ? 0 : parseInt(req.query.offset))
    let limit = (typeof(req.query.pageLimit) === 'undefined' ? 10 : parseInt(req.query.pageLimit))
    
    let sortCriteria = ' ORDER BY ' + sortBy + ' ' + sortOrder
    let limitCriteria = ' LIMIT ' + limit + ' OFFSET ' + offset
    
    pool.getConnection((err, connection) => {
        if (err) {
            console.log(err)
            res.status(500).end()
        }

        let myQuery = sqlGetBookList + sortCriteria + limitCriteria
        let bookList = []
        connection.query(myQuery, finalCriteriaFromType, (err, results) => {
            connection.release()
            if (err) {
                console.log(err)
                res.status(500).end()
            }
            
            results.forEach(element => {
                bookList.push({author: element.author_firstname + ' ' + element.author_lastname, 
                    title : element.title,
                    img_url : '/' + element.cover_thumbnail
                })
            })
            res.json(bookList)
        })
        
        
    })
})

app.get('/book/:bookId', (req, res) => {

    let bookid = req.params.bookId;
    console.log('>>>bookid', bookid);
    
    pool.getConnection((err, connection) => {
        if (err) {
            console.log(err)
            res.status(500).end()
        }

        let book = []
        connection.query(sqlGetBook, [ parseInt(bookid) ]  , (err, result) => {
            connection.release()
            if (err) {
                console.log(err)
                res.status(500).end()
            }
            
            result.forEach(element => {
                book.push(
                    {
                        author: element.author_firstname + ' ' + element.author_lastname, 
                        title : element.title,
                        img_url : '/' + element.cover_thumbnail
                    })
            })

            res.json(book)
            
        })


    })
    
})

app.post('/upload',  (req, res, next) => {
    upload(req, res, err => {
        if (err) {
            return res.send(err)
        }
        console.log('file uploaded')
        res.end()
    })
})

app.use(express.static(path.join(__dirname, 'thumbnails')));

app.listen(APP_PORT, () => {
    console.info(`Listening to server at ${APP_PORT}`)
})