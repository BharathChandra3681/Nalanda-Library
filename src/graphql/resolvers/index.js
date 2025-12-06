const userResolver = require('./userResolver');
const bookResolver = require('./bookResolver');
const borrowResolver = require('./borrowResolver');
const reportResolver = require('./reportResolver');

// Merge all resolvers
const resolvers = {
  Query: {
    ...userResolver.Query,
    ...bookResolver.Query,
    ...borrowResolver.Query,
    ...reportResolver.Query
  },
  Mutation: {
    ...userResolver.Mutation,
    ...bookResolver.Mutation,
    ...borrowResolver.Mutation
  },
  // Field resolvers
  User: userResolver.User,
  Book: bookResolver.Book,
  Borrowing: borrowResolver.Borrowing
};

module.exports = resolvers;