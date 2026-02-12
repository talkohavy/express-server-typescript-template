export type Book = {
  id: number;
  name: string;
  author: string;
  publishedYear: number;
  genre: string;
  isbn: string;
  coverImageUrl: string;
  description: string;
  pageCount: number;
  rating: number;
  language: string;
  publisher: string;
  createdAt: string;
};

export type PaginatedBooksResponse = {
  data: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
};
