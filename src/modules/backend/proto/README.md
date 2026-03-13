# Backend gRPC contracts

This folder holds Protocol Buffer (`.proto`) definitions for gRPC services used by the backend module.

## Books service (`books.proto`)

- **Package:** `backend.books.v1`
- **Purpose:** Contract for the Books domain, aligned with the existing HTTP/JSON API (see `IBooksAdapter` and Books controller). Supports GetBooks (paginated), GetBookById, CreateBook, UpdateBook, DeleteBook.
- **Status:** Contract only. Proto codegen, gRPC server in the Books micro-service, and a backend `BooksGrpcAdapter` are not yet implemented.
