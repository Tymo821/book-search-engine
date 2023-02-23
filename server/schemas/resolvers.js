const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    // Query to get the currently authenticated user
    me: async (parent, args, context) => {
      if (context.user) {
        // Find the authenticated user by their id and populate their saved books
        return User.findOne({ _id: context.user._id });
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },

  Mutation: {
    // Mutation to add a new user
    addUser: async (parent, { username, email, password }) => {
      // Create a new user with the specified parameters
      const user = await User.create({ username, email, password });
      // Sign a new token for the user
      const token = signToken(user);
      // Return the token and the user
      return { token, user };
    },
    // Mutation to log in an existing user
    login: async (parent, { email, password }) => {
      // Find the user with the specified email
      const user = await User.findOne({ email });

      if (!user) {
        // If no user was found, throw an error
        throw new AuthenticationError('No user found with this email address');
      }

      // Check if the provided password is correct
      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        // If the password is incorrect, throw an error
        throw new AuthenticationError('Incorrect credentials');
      }

      // Sign a new token for the user
      const token = signToken(user);
      // Return the token and the user
      return { token, user };
    },
    // Mutation to save a book for a specific user
    saveBook: async (parent, args, context) => {
      if (context.user) {
        //const { bookId, authors, description, title, image, link } = args;
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: args } },
          { new: true }
        );
        return user;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    // Mutation to unsave a book for a specific user
    removeBook: async (parent, args, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: args.bookId } } },
          { new: true }
        );
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

module.exports = resolvers;