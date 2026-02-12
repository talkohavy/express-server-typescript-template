export const BookObject = {
  type: 'object',
  required: ['id', 'name', 'author', 'publishedYear', 'genre', 'isbn', 'coverImageUrl', 'description', 'pageCount', 'rating', 'language', 'publisher', 'createdAt'],
  properties: {
    id: { type: 'integer', format: 'int64', example: 1 },
    name: { type: 'string', example: 'The Great Gatsby' },
    author: { type: 'string', example: 'F. Scott Fitzgerald' },
    publishedYear: { type: 'integer', example: 1925 },
    genre: { type: 'string', example: 'Fiction' },
    isbn: { type: 'string', example: '978-0743273565-0' },
    coverImageUrl: { type: 'string', example: 'https://picsum.photos/seed/1/300/450' },
    description: { type: 'string', example: 'A compelling narrative that explores the depths of human experience.' },
    pageCount: { type: 'integer', example: 180 },
    rating: { type: 'number', example: 4.2 },
    language: { type: 'string', example: 'English' },
    publisher: { type: 'string', example: 'Penguin Random House' },
    createdAt: { type: 'string', format: 'date-time', example: '1925-04-10T00:00:00.000Z' },
  },
};
