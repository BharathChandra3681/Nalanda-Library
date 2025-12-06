const gql = require('graphql-tag');

const typeDefs = gql`
  # ==================== ENUMS ====================
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

  # ==================== TYPES ====================
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

  type AuthPayload {
    token: String!
    user: User!
  }

  # ==================== PAGINATION ====================
  type PageInfo {
    currentPage: Int!
    totalPages: Int!
    totalCount: Int!
    limit: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

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

  # ==================== REPORT TYPES ====================
  type MostBorrowedBook {
    bookId: ID!
    title: String!
    author: String!
    isbn: String!
    genre: String
    borrowCount: Int!
  }

  type ActiveMember {
    userId: ID!
    name: String!
    email: String!
    role: Role!
    borrowCount: Int!
    lastBorrowed: String
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

  type AvailabilitySummary {
    books: BookStats!
    borrowings: BorrowingStats!
  }

  type GenreDistribution {
    genre: String!
    titleCount: Int!
    totalCopies: Int!
    availableCopies: Int!
  }

  # ==================== INPUTS ====================
  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: Role
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input BookInput {
    title: String!
    author: String!
    isbn: String!
    publicationDate: String
    genre: String
    totalCopies: Int!
  }

  input UpdateBookInput {
    title: String
    author: String
    isbn: String
    publicationDate: String
    genre: String
    totalCopies: Int
    availableCopies: Int
  }

  input BookFilterInput {
    genre: String
    author: String
    search: String
    available: Boolean
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 10
  }

  # ==================== QUERIES ====================
  type Query {
    # Auth
    me: User

    # Users (Admin only)
    users(pagination: PaginationInput): UserConnection!
    user(id: ID!): User

    # Books
    books(filter: BookFilterInput, pagination: PaginationInput): BookConnection!
    book(id: ID!): Book

    # Borrowing
    myBorrowHistory(status: BorrowStatus, pagination: PaginationInput): BorrowingConnection!
    myCurrentBorrowings: [Borrowing!]!
    
    # Admin Borrowing
    allBorrowings(status: BorrowStatus, pagination: PaginationInput): BorrowingConnection!
    userBorrowHistory(userId: ID!, status: BorrowStatus, pagination: PaginationInput): BorrowingConnection!

    # Reports (Admin only)
    mostBorrowedBooks(limit: Int): [MostBorrowedBook!]!
    activeMembers(limit: Int): [ActiveMember!]!
    availabilitySummary: AvailabilitySummary!
    genreDistribution: [GenreDistribution!]!
  }

  # ==================== MUTATIONS ====================
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Books (Admin only)
    createBook(input: BookInput!): Book!
    updateBook(id: ID!, input: UpdateBookInput!): Book!
    deleteBook(id: ID!): Boolean!

    # Borrowing (Member only)
    borrowBook(bookId: ID!): Borrowing!
    returnBook(borrowId: ID!): Borrowing!

    # User Management (Admin only)
    updateUserRole(userId: ID!, role: Role!): User!
    deactivateUser(userId: ID!): User!
  }
`;

module.exports = typeDefs;