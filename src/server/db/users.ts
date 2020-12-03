import bcrypt from "bcrypt";
import PasswordValidator from "password-validator";
import { QueryResult } from "pg";
import { v4 as uuidv4 } from "uuid";
import validator from "validator";
import { UserConfig, UserCredentials, UserDetails } from "../types";
import {
	InvalidPasswordError,
	InvalidInputError,
	InvalidUsernameError,
	UsernameInUseError,
} from "./errors";
import QueryDispatcher from "./dispatch";

const passwordValidator = new PasswordValidator();
passwordValidator.is().min(8).is().max(50).has().not().spaces();

/**
 * Defines a user object for the blog's database.
 */
class User {
	id: string;
	username: string;
	hash: string;
	created_at: Date;
	static dispatcher: QueryDispatcher;

	/**
	 * @param {UserDetails} user - Object containing database contents for user.
	 */
	private constructor(user: UserDetails) {
		this.id = user.id;
		this.username = user.username;
		this.hash = user.hash;
		this.created_at = user.created_at;
	}

	/**
	 * Validates the user password in order for the user to be authenticated.
	 * @param {string} password - The password to be validated for authentication
	 */
	async validPassword(password: string): Promise<boolean> {
		const isValid = await bcrypt.compare(password, this.hash);
		return isValid;
	}

	toJSON() {
		return {
			id: this.id,
			username: this.username,
			created_at: this.created_at,
		};
	}

	/**
	 * Deletes a user with the corresponding id
	 * @param {string} id - User id (uuid)
	 */
	static async deleteById(id: string): Promise<User | undefined> {
		const result = await User.dispatchQuery("DELETE FROM users WHERE id = $1 RETURNING *", [
			id,
		]);
		if (User.queryWasInvalid(result)) {
			throw new InvalidInputError();
		}
		if (User.queryResultIsEmpty(result)) {
			return;
		}
		return User.parseSingleQueryResult(result);
	}

	/**
	 * Deletes and returns the user with the corresponding username
	 * @param {string} username - Username
	 */
	static async deleteByUsername(username: string): Promise<User | undefined> {
		const result = await User.dispatchQuery(
			"DELETE FROM users WHERE username = $1 RETURNING *",
			[username]
		);
		if (User.queryWasInvalid(result)) {
			throw new InvalidInputError();
		}
		if (User.queryResultIsEmpty(result)) {
			return;
		}
		return User.parseSingleQueryResult(result);
	}

	/**
	 * Dispatches an SQL query to the database
	 * @param {string} query - SQL query string
	 * @param {Array} values - Array of values to inject into query string
	 */
	static async dispatchQuery(query: string, values: any[]): Promise<QueryResult | undefined> {
		const response = await User.dispatcher.dispatch(query, values);
		return response;
	}

	/**
	 * Finds and returns the user with the corresponding id.
	 * @param {string} id - The UUID for the user in the database.
	 */
	static async findById(id: string): Promise<User | undefined> {
		const result = await User.dispatchQuery("SELECT * FROM users WHERE id = $1", [id]);
		if (User.queryWasInvalid(result)) {
			throw new InvalidInputError();
		}
		if (User.queryResultIsEmpty(result)) {
			return;
		}
		return User.parseSingleQueryResult(result);
	}

	/**
	 * Finds and returns the user with the corresponding username.
	 * @param {string} username - The username of the user.
	 */
	static async findByUsername(username: string): Promise<User | undefined> {
		const result = await User.dispatchQuery("SELECT * FROM users WHERE username = $1", [
			username,
		]);
		if (User.queryWasInvalid(result)) {
			throw new InvalidInputError();
		}
		if (User.queryResultIsEmpty(result)) {
			return;
		}
		return User.parseSingleQueryResult(result);
	}

	/**
	 * Registers the user's information in the database.
	 * @param {UserCredentials} credentials - Object containing username and password of user.
	 * @param {UserConfig} options - Object containing other details of user.
	 */
	static async register(
		{ username, password }: UserCredentials,
		options: UserConfig
	): Promise<User | undefined> {
		User.validateUsername(username);
		User.validatePassword(password);

		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(validator.trim(password), salt);
		const created_at = new Date();
		const id = options.id || uuidv4();

		const result = await User.dispatchQuery(
			"INSERT INTO users(id, username, hash, created_at) VALUES($1, $2, $3, $4) RETURNING *",
			[id, validator.trim(username), hash, created_at]
		);

		if (!result) {
			throw new UsernameInUseError();
		}

		return User.parseSingleQueryResult(result);
	}

	/**
	 * Updates the username of the user with the given id in the database.
	 * @param {string} id - User's ID to change the username of
	 * @param username - New username
	 */
	static async updateUsername(id: string, username: string): Promise<User | undefined> {
		User.validateUsername(username);

		const result = await User.dispatchQuery(
			"UPDATE users SET username = $1 WHERE id = $2 RETURNING *",
			[validator.trim(username), id]
		);

		if (User.queryWasInvalid(result)) {
			throw new InvalidInputError();
		}
		if (User.queryResultIsEmpty(result)) {
			return;
		}
		return User.parseSingleQueryResult(result);
	}

	/**
	 * Validates a password to be used in the blog's database.
	 * @param {string} password
	 */
	static validatePassword(password: string): boolean {
		const trimmedPassword = validator.trim(password);
		const errors = passwordValidator.validate(trimmedPassword, { list: true });
		if (errors.length > 0) {
			throw new InvalidPasswordError(errors);
		}

		return true;
	}

	/**
	 * Validates a username to be used in the blog's database.
	 * @param {string} username
	 */
	static validateUsername(username: string): boolean {
		const trimmedUsername = validator.trim(username);
		const errors = [];
		if (
			!validator.isLength(trimmedUsername, {
				min: 3,
				max: 16,
			})
		) {
			errors.push("length");
		}

		if (!validator.isAlphanumeric(trimmedUsername)) {
			errors.push("alphanumeric");
		}

		if (errors.length > 0) {
			throw new InvalidUsernameError(errors);
		}

		return true;
	}

	/**
	 * Parses the query result to return the first result.
	 * @param {QueryResult} result - The result of the SQL query
	 */
	static parseSingleQueryResult(result: QueryResult): User {
		return new User(result.rows[0]);
	}

	/**
	 * Determines if the SQL query returned a row from the database.
	 * @param result - The result of the SQL query
	 */
	static queryResultIsEmpty(result: QueryResult): boolean {
		return result.rows.length === 0;
	}

	/**
	 * Determines if the SQL query was invalid and returned an empty result.
	 * @param {QueryResult} result - The result of the SQL query
	 */
	static queryWasInvalid(result: QueryResult): boolean {
		return typeof result === "undefined";
	}

	/**
	 * Loads the SQL query dispatcher
	 * @param dispatcher - SQL Query Dispatcher
	 */
	static loadDispatcher(dispatcher: QueryDispatcher) {
		User.dispatcher = dispatcher;
	}

	/**
	 * Shuts down the SQL query dispatcher
	 */
	static endDispatcher() {
		if (User.dispatcher) {
			User.dispatcher.end();
			User.dispatcher = undefined;
		}
	}

	/**
	 * Initializes the User class
	 */
	static init() {
		User.loadDispatcher(new QueryDispatcher());
	}
}

User.init();

export default User;
