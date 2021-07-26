const User = require("../models/User");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-express");

const resolvers = {
	Query: {
		me: () => {
			if (context.user) {
				const userData = User.findOne({ _id: context.user._id }).select(
					"-__v -password"
				);

				return userData;
			}
			throw new AuthenticationError("Not logged in");
		},
	},
	Mutation: {
		addUser: async (parent, args) => {
			console.log("add user args ???", args);
			const user = await User.create(args);
			const token = signToken(user);

			return { token, user };
		},
		login: async (parent, { email, password }) => {
			const user = await User.findOne({ email });

			if (!user) {
				throw new AuthenticationError("Incorrect credentials");
			}

			const correctPw = await user.isCorrectPassword(password);

			if (!correctPw) {
				throw new AuthenticationError("Incorrect credentials");
			}

			const token = signToken(user);
			return { token, user };
		},
		saveBook: async (
			parent,
			{ bookId, authors, description, title, image, link },
			context
		) => {
			if (context.user) {
				await User.findByIdAndUpdate(
					{ _id: context.user._id },
					{
						$push: {
							savedBooks: { bookId, authors, description, title, image, link },
						},
					},
					{ new: true }
				);

				return User;
			}
			throw new AuthenticationError("You need to be logged in!");
		},
		removeBook: async (parent, { bookId }, context) => {
			if (context.user) {
				const updatedUser = await User.findOneAndUpdate(
					{ _id: context.user._id },
					{ $pull: { savedBooks: bookId } },
					{ new: true }
				);

				return updatedUser;
			}

			throw new AuthenticationError("You need to be logged in!");
		},
	},
};

module.exports = resolvers;
