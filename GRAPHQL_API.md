# GraphQL API Documentation

## Endpoint
```
POST /graphql
```

## Authentication
Include the encrypted JWT token in the Authorization header:
```
Authorization: Bearer <encrypted-jwt-token>
```

The GraphQL context automatically validates the token and provides user information to resolvers.

---

## Table of Contents
- [Authentication](#authentication-operations)
- [User Management](#user-management)
- [Book Management](#book-management)
- [Borrowing System](#borrowing-system)
- [Reports & Analytics](#reports--analytics)
- [Type Definitions](#type-definitions)

---

## Authentication Operations

### Register User
```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    token
    user {
      id
      name
      email
      role
      isActive
      createdAt
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "member"
  }
}
```

**Response:**
```json
{
  "data": {
    "register": {
      "token": "U2FsdGVkX1/...",
      "user": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "member",
        "isActive": true,
        "createdAt": "2025-12-05T12:00:00.000Z"
      }
    }
  }
}
```

---

### Login
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      name
      email
      role
      isActive
    }
  }
}
```

**Variables:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

## User Management

### Get Current User Profile
```graphql
query Me {
  me {
    id
    name
    email
    role
    isActive
    createdAt
    updatedAt
    borrowHistory {
      id
      book {
        title
        author
      }
      borrowDate
      dueDate
      status
    }
  }
}
```

**Authentication:** Required

---

### Get User by ID
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    role
    isActive
    createdAt
    borrowHistory {
      id
      book {
        title
      }
      status
    }
  }
}
```

**Variables:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Authentication:** Required (Admin only)

---

### Get All Users
```graphql
query GetUsers($page: Int, $limit: Int) {
  users(page: $page, limit: $limit) {
    users {
      id
      name
      email
      role
      isActive
      createdAt
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
      limit
      hasNextPage
      hasPrevPage
    }
  }
}
```

**Variables:**
```json
{
  "page": 1,
  "limit": 10
}
```

**Authentication:** Required (Admin only)

---

### Update User Role
```graphql
mutation UpdateUserRole($userId: ID!, $role: Role!) {
  updateUserRole(userId: $userId, role: $role) {
    id
    name
    email
    role
  }
}
```

**Variables:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "admin"
}
```

**Authentication:** Required (Admin only)

---

### Deactivate User
```graphql
mutation DeactivateUser($userId: ID!) {
  deactivateUser(userId: $userId) {
    success
    message
  }
}
```

**Variables:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Authentication:** Required (Admin only)

---

## Book Management

### Get All Books
```graphql
query GetBooks($page: Int, $limit: Int, $genre: String, $author: String, $search: String) {
  books(page: $page, limit: $limit, genre: $genre, author: $author, search: $search) {
    books {
      id
      title
      author
      isbn
      publicationDate
      genre
      totalCopies
      availableCopies
      isAvailable
      addedBy {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
      limit
      hasNextPage
      hasPrevPage
    }
  }
}
```

**Variables:**
```json
{
  "page": 1,
  "limit": 10,
  "genre": "fiction",
  "search": "gatsby"
}
```

**Authentication:** Required

---

### Get Book by ID
```graphql
query GetBook($id: ID!) {
  book(id: $id) {
    id
    title
    author
    isbn
    publicationDate
    genre
    totalCopies
    availableCopies
    isAvailable
    addedBy {
      id
      name
      email
    }
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Authentication:** Required

---

### Create Book
```graphql
mutation CreateBook($input: BookInput!) {
  createBook(input: $input) {
    id
    title
    author
    isbn
    genre
    totalCopies
    availableCopies
    isAvailable
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "publicationDate": "1925-04-10",
    "genre": "fiction",
    "totalCopies": 5
  }
}
```

**Authentication:** Required (Admin only)

---

### Update Book
```graphql
mutation UpdateBook($id: ID!, $input: UpdateBookInput!) {
  updateBook(id: $id, input: $input) {
    id
    title
    author
    isbn
    genre
    totalCopies
    availableCopies
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "input": {
    "totalCopies": 10,
    "availableCopies": 8
  }
}
```

**Authentication:** Required (Admin only)

---

### Delete Book
```graphql
mutation DeleteBook($id: ID!) {
  deleteBook(id: $id) {
    success
    message
  }
}
```

**Variables:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Authentication:** Required (Admin only)

---

## Borrowing System

### Borrow Book
```graphql
mutation BorrowBook($bookId: ID!) {
  borrowBook(bookId: $bookId) {
    id
    user {
      id
      name
      email
    }
    book {
      id
      title
      author
    }
    borrowDate
    dueDate
    status
  }
}
```

**Variables:**
```json
{
  "bookId": "507f1f77bcf86cd799439011"
}
```

**Authentication:** Required (Member only)

**Behavior:**
- Checks book availability (availableCopies > 0)
- Prevents duplicate borrowing (same book already borrowed)
- Automatically sets due date (14 days from borrow date)
- Decreases availableCopies by 1

---

### Return Book
```graphql
mutation ReturnBook($borrowingId: ID!) {
  returnBook(borrowingId: $borrowingId) {
    id
    book {
      title
    }
    borrowDate
    dueDate
    returnDate
    status
  }
}
```

**Variables:**
```json
{
  "borrowingId": "507f1f77bcf86cd799439011"
}
```

**Authentication:** Required (Member only)

**Behavior:**
- Sets returnDate to current timestamp
- Updates status to "returned"
- Increases book's availableCopies by 1

---

### Get My Borrow History
```graphql
query MyBorrowHistory($page: Int, $limit: Int) {
  myBorrowHistory(page: $page, limit: $limit) {
    borrowings {
      id
      book {
        title
        author
        isbn
      }
      borrowDate
      dueDate
      returnDate
      status
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
      hasNextPage
    }
  }
}
```

**Variables:**
```json
{
  "page": 1,
  "limit": 10
}
```

**Authentication:** Required

---

### Get Current Borrowings
```graphql
query CurrentBorrowings {
  currentBorrowings {
    id
    book {
      title
      author
      isbn
    }
    borrowDate
    dueDate
    status
  }
}
```

**Authentication:** Required

**Returns:** All books currently borrowed (status = "borrowed" or "overdue")

---

### Get All Borrowings (Admin)
```graphql
query AllBorrowings($page: Int, $limit: Int) {
  allBorrowings(page: $page, limit: $limit) {
    borrowings {
      id
      user {
        name
        email
      }
      book {
        title
        author
      }
      borrowDate
      dueDate
      returnDate
      status
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
    }
  }
}
```

**Authentication:** Required (Admin only)

---

### Get User Borrow History (Admin)
```graphql
query UserBorrowHistory($userId: ID!, $page: Int, $limit: Int) {
  userBorrowHistory(userId: $userId, page: $page, limit: $limit) {
    borrowings {
      id
      book {
        title
        author
      }
      borrowDate
      dueDate
      returnDate
      status
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
    }
  }
}
```

**Variables:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "page": 1,
  "limit": 10
}
```

**Authentication:** Required (Admin only)

---

## Reports & Analytics

### Most Borrowed Books
```graphql
query MostBorrowedBooks($limit: Int) {
  mostBorrowedBooks(limit: $limit) {
    bookId
    title
    author
    isbn
    genre
    borrowCount
  }
}
```

**Variables:**
```json
{
  "limit": 10
}
```

**Authentication:** Required (Admin only)

**Implementation:** Uses MongoDB aggregation pipeline with `$group`, `$lookup`, `$sort`

---

### Active Members
```graphql
query ActiveMembers($limit: Int) {
  activeMembers(limit: $limit) {
    userId
    name
    email
    role
    borrowCount
    lastBorrowed
  }
}
```

**Variables:**
```json
{
  "limit": 10
}
```

**Authentication:** Required (Admin only)

**Implementation:** Uses MongoDB aggregation pipeline to rank users by borrow count

---

### Availability Summary
```graphql
query AvailabilitySummary {
  availabilitySummary {
    books {
      totalCopies
      availableCopies
      borrowedCopies
      uniqueTitles
    }
    borrowings {
      currentlyBorrowed
      overdue
      returned
      total
    }
  }
}
```

**Authentication:** Required (Admin only)

**Returns:** Comprehensive overview of library inventory and borrowing statistics

---

### Genre Distribution
```graphql
query GenreDistribution {
  genreDistribution {
    genre
    titleCount
    totalCopies
    availableCopies
  }
}
```

**Authentication:** Required (Admin only)

**Implementation:** Aggregates books by genre with copy counts

---

## Type Definitions

### Enums

```graphql
enum Role {
  admin
  member
}

enum BorrowStatus {
  borrowed
  returned
  overdue
}

enum SortOrder {
  ASC
  DESC
}
```

---

### Core Types

#### User
```graphql
type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  isActive: Boolean!
  createdAt: String!
  updatedAt: String!
  borrowHistory: [Borrowing!]
}
```

#### Book
```graphql
type Book {
  id: ID!
  title: String!
  author: String!
  isbn: String!
  publicationDate: String
  genre: String
  totalCopies: Int!
  availableCopies: Int!
  isAvailable: Boolean!
  addedBy: User
  createdAt: String!
  updatedAt: String!
}
```

#### Borrowing
```graphql
type Borrowing {
  id: ID!
  user: User!
  book: Book!
  borrowDate: String!
  dueDate: String!
  returnDate: String
  status: BorrowStatus!
  createdAt: String!
}
```

#### AuthPayload
```graphql
type AuthPayload {
  token: String!
  user: User!
}
```

---

### Pagination Types

#### PageInfo
```graphql
type PageInfo {
  currentPage: Int!
  totalPages: Int!
  totalCount: Int!
  limit: Int!
  hasNextPage: Boolean!
  hasPrevPage: Boolean!
}
```

#### Connections
```graphql
type BookConnection {
  books: [Book!]!
  pageInfo: PageInfo!
}

type UserConnection {
  users: [User!]!
  pageInfo: PageInfo!
}

type BorrowingConnection {
  borrowings: [Borrowing!]!
  pageInfo: PageInfo!
}
```

---

### Report Types

#### MostBorrowedBook
```graphql
type MostBorrowedBook {
  bookId: ID!
  title: String!
  author: String!
  isbn: String!
  genre: String
  borrowCount: Int!
}
```

#### ActiveMember
```graphql
type ActiveMember {
  userId: ID!
  name: String!
  email: String!
  role: Role!
  borrowCount: Int!
  lastBorrowed: String!
}
```

#### AvailabilitySummary
```graphql
type AvailabilitySummary {
  books: BookStats!
  borrowings: BorrowingStats!
}

type BookStats {
  totalCopies: Int!
  availableCopies: Int!
  borrowedCopies: Int!
  uniqueTitles: Int!
}

type BorrowingStats {
  currentlyBorrowed: Int!
  overdue: Int!
  returned: Int!
  total: Int!
}
```

#### GenreDistribution
```graphql
type GenreDistribution {
  genre: String!
  titleCount: Int!
  totalCopies: Int!
  availableCopies: Int!
}
```

---

### Input Types

#### RegisterInput
```graphql
input RegisterInput {
  name: String!
  email: String!
  password: String!
  role: Role
}
```

#### BookInput
```graphql
input BookInput {
  title: String!
  author: String!
  isbn: String!
  publicationDate: String
  genre: String
  totalCopies: Int!
}
```

#### UpdateBookInput
```graphql
input UpdateBookInput {
  title: String
  author: String
  isbn: String
  publicationDate: String
  genre: String
  totalCopies: Int
  availableCopies: Int
}
```

---

## Error Handling

GraphQL errors follow this format:

```json
{
  "errors": [
    {
      "message": "Authentication required. Please login.",
      "path": ["me"],
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ],
  "data": null
}
```

### Common Error Codes
- `UNAUTHENTICATED` - No valid token provided
- `FORBIDDEN` - Insufficient permissions
- `BAD_USER_INPUT` - Validation error
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error

---

## Testing GraphQL API

### Using cURL
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <encrypted-token>" \
  -d '{
    "query": "query { me { id name email role } }"
  }'
```

### Using GraphQL Playground
Navigate to `http://localhost:3000/graphql` in your browser (if GraphQL Playground is enabled).

### Using Apollo Studio
Connect to `http://localhost:3000/graphql` for interactive exploration.

---

## Best Practices

1. **Always include required fields** in queries to avoid errors
2. **Use fragments** for reusable field selections
3. **Paginate large result sets** to improve performance
4. **Handle errors gracefully** by checking the `errors` field
5. **Keep tokens secure** - never commit tokens to version control
6. **Use variables** instead of string interpolation for dynamic values

---

## Complete Query Examples

### Complex Book Search with Pagination
```graphql
query SearchBooks($search: String!, $page: Int!, $limit: Int!) {
  books(search: $search, page: $page, limit: $limit) {
    books {
      id
      title
      author
      genre
      isAvailable
      availableCopies
      addedBy {
        name
      }
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
      hasNextPage
      hasPrevPage
    }
  }
}
```

### User Profile with Borrowing History
```graphql
query UserProfile {
  me {
    id
    name
    email
    role
    borrowHistory {
      id
      book {
        title
        author
        isbn
      }
      borrowDate
      dueDate
      returnDate
      status
    }
  }
}
```

### Complete Borrow Flow
```graphql
# 1. Search for a book
query FindBook {
  books(search: "gatsby") {
    books {
      id
      title
      isAvailable
    }
  }
}

# 2. Borrow the book
mutation BorrowGatsby {
  borrowBook(bookId: "507f1f77bcf86cd799439011") {
    id
    dueDate
    status
  }
}

# 3. Check current borrowings
query MyBooks {
  currentBorrowings {
    id
    book {
      title
    }
    dueDate
    status
  }
}

# 4. Return the book
mutation ReturnGatsby {
  returnBook(borrowingId: "507f1f77bcf86cd799439011") {
    status
    returnDate
  }
}
```

---

**For more information, visit the REST API documentation in `swagger.yaml`**
