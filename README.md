# Library Catalogue 

API documentation for Library Catalogue

## APIs Available

### /books

This API will give you a listing of books in the catalogue. By default, it will give you the first 10 records.

This API can accept the following parameters:
- **title** : Key to search for title 
- **author** : Key to search for author
- **sortBy** : Sort by author or title 
- **sortOrder** : Sort Order for Column
- **limit** : number of records to display in result
- **offset** : start from which record 


### /book/:bookId

This will give you detailed information of a book based on the :bookId provided

### /upload

This will allow you to upload images to the thumbnails directory

