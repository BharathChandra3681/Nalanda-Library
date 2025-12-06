# Nalanda Library Management System API

A comprehensive backend system for library management built with Node.js, Express, MongoDB, and GraphQL.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **GraphQL:** Apollo Server v4
- **Authentication:** JWT with AES encryption
- **Validation:** express-validator

## 📋 Features

### User Management
- User registration and login
- JWT-based authentication with encryption layer
- Role-based access control (Admin/Member)

### Book Management
- CRUD operations for books
- Pagination and filtering (by genre, author, availability)
- Search functionality

### Borrowing System
- Borrow and return books
- Automatic due date calculation (14 days)
- Overdue status tracking
- Borrowing history

### Reports & Analytics
- Most borrowed books
- Most active members
- Book availability summary
- Genre distribution

## 🛠️ Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
   git clone <repository-url>
   cd nalanda-library-api
```

2. **Install dependencies**
```bash
   npm install
```

3. **Configure environment variables**
```bash
   cp .env.example .env
```
   
   Edit `.env` with your configuration:
```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/nalanda_library
   JWT_SECRET=your_super_secret_jwt_key
   JWT_ENCRYPTION_KEY=your_32_character_encryption_key
   JWT_EXPIRES_IN=7d
```

4. **Start MongoDB**
```bash
   # If using Homebrew on Mac
   brew services start mongodb-community
   
   # Or run directly
   mongod
```

5. **Start the server**
```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
```

## 📡 API Endpoints

### Base URLs
- **REST API:** `http://localhost:3000/api`
- **GraphQL:** `http://localhost:3000/graphql`
- **Health Check:** `http://localhost:3000/health`

### REST API Endpoints

#### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Authenticated |
| GET | `/api/auth/users` | List all users | Admin |
| PATCH | `/api/auth/users/:id/role` | Update user role | Admin |
| DELETE | `/api/auth/users/:id` | Deactivate user | Admin |

#### Books
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/books` | List books (with filters) | Authenticated |
| GET | `/api/books/:id` | Get book by ID | Authenticated |
| POST | `/api/books` | Add new book | Admin |
| PUT | `/api/books/:id` | Update book | Admin |
| DELETE | `/api/books/:id` | Delete book | Admin |

**Query Parameters for GET /api/books:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `genre` - Filter by genre
- `author` - Filter by author
- `search` - Search in title and author
- `available` - Filter by availability (true/false)

#### Borrowing
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/borrow` | Borrow a book | Member |
| POST | `/api/borrow/return/:id` | Return a book | Member |
| GET | `/api/borrow/history` | Get own borrow history | Authenticated |
| GET | `/api/borrow/current` | Get current borrowings | Authenticated |
| GET | `/api/borrow/all` | Get all borrowings | Admin |
| GET | `/api/borrow/history/:userId` | Get user's history | Admin |

#### Reports
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/reports/most-borrowed` | Most borrowed books | Admin |
| GET | `/api/reports/active-members` | Most active members | Admin |
| GET | `/api/reports/availability` | Availability summary | Admin |
| GET | `/api/reports/genre-distribution` | Genre distribution | Admin |

### GraphQL API

Access GraphQL Playground at `http://localhost:3000/graphql`

#### Example Queries

**Register User:**
```graphql
mutation {
  register(input: {
    name: "John Doe"
    email: "john@example.com"
    password: "password123"
    role: member
  }) {
    token
    user {
      id
      name
      email
      role
    }
  }
}
```

**Login:**
```graphql
mutation {
  login(input: {
    email: "john@example.com"
    password: "password123"
  }) {
    token
    user {
      id
      name
      role
    }
  }
}
```

**Get Books:**
```graphql
query {
  books(
    filter: { genre: "fiction", available: true }
    pagination: { page: 1, limit: 10 }
  ) {
    books {
      id
      title
      author
      availableCopies
      isAvailable
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
    }
  }
}
```

**Borrow Book:**
```graphql
mutation {
  borrowBook(bookId: "book_id_here") {
    id
    book {
      title
    }
    borrowDate
    dueDate
    status
  }
}
```

**Get Reports:**
```graphql
query {
  mostBorrowedBooks(limit: 5) {
    title
    author
    borrowCount
  }
  
  availabilitySummary {
    books {
      totalCopies
      availableCopies
      borrowedCopies
    }
    borrowings {
      currentlyBorrowed
      overdue
    }
  }
}
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <encrypted_token>
```

The token is encrypted using AES encryption for additional security.

### User Roles
- **Admin:** Full access to all operations
- **Member:** Can browse books, borrow/return books, view own history

## 📁 Project Structure
```
nalanda-library-api/
├── src/
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   └── env.js          # Environment configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   ├── borrowController.js
│   │   └── reportController.js
│   ├── graphql/
│   │   ├── context.js      # GraphQL context & auth helpers
│   │   ├── resolvers/
│   │   │   ├── bookResolver.js
│   │   │   ├── borrowResolver.js
│   │   │   ├── reportResolver.js
│   │   │   ├── userResolver.js
│   │   │   └── index.js
│   │   └── schema/
│   │       ├── typeDefs.js
│   │       └── index.js
│   ├── middlewares/
│   │   ├── auth.js         # JWT authentication
│   │   ├── errorHandler.js # Global error handling
│   │   └── validate.js     # Request validation
│   ├── models/
│   │   ├── Book.js
│   │   ├── Borrowing.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── borrowRoutes.js
│   │   ├── reportRoutes.js
│   │   └── index.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── bookService.js
│   │   ├── borrowService.js
│   │   └── reportService.js
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── encryption.js   # JWT encryption utilities
│   │   └── pagination.js
│   └── app.js              # Application entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🗄️ Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'member',
  isActive: Boolean,
  timestamps: true
}
```

### Book
```javascript
{
  title: String,
  author: String,
  isbn: String (unique),
  publicationDate: Date,
  genre: String,
  totalCopies: Number,
  availableCopies: Number,
  addedBy: ObjectId (ref: User),
  timestamps: true
}
```

### Borrowing
```javascript
{
  user: ObjectId (ref: User),
  book: ObjectId (ref: Book),
  borrowDate: Date,
  dueDate: Date,
  returnDate: Date,
  status: 'borrowed' | 'returned' | 'overdue',
  timestamps: true
}
```

## 🧪 Testing the API

### Using cURL
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"admin123","role":"admin"}'

# Login and save token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' | jq -r '.data.token')

# Create a book
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"The Great Gatsby","author":"F. Scott Fitzgerald","isbn":"9780743273565","genre":"fiction","totalCopies":5}'

# Get all books
curl -X GET "http://localhost:3000/api/books?genre=fiction" \
  -H "Authorization: Bearer $TOKEN"
```

### Using GraphQL Playground

1. Open `http://localhost:3000/graphql`
2. Set HTTP Headers:
```json
   {
     "Authorization": "Bearer <your_token>"
   }
```
3. Run queries and mutations

## 📝 Additional Notes

- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens are encrypted using AES for additional security
- Default borrow period is 14 days
- Overdue status is automatically updated when checking borrowings
- Books cannot be deleted if copies are currently borrowed

## 👨‍💻 Author

Developed as part of Heumn Interactive Backend Developer Assessment

## 📄 License

ISC