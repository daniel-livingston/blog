import bcrypt from "bcrypt";
import passwordValidator from "password-validator";
import { QueryResult } from "pg";
import { v4 as uuidv4 } from "uuid";
import validator from "validator";
import { UserConfig, UserCredentials, UserDetails, UserSearchOptions } from "../types";
import { InvalidUsernameError } from "./errors";
import QueryDispatcher from "./dispatch";

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

	toJSON() {
		return {
			id: this.id,
			username: this.username,
			created_at: this.created_at,
		};
	}

	static async dispatchQuery(query: string, values: any[]): Promise<QueryResult | undefined> {
		const response = await User.dispatcher.dispatch(query, values);
		return response;
	}

	/**
	 * Finds and returns the user with the corresponding id.
	 * @param {string} id - The UUID for the user in the database.
	 */
	static async findById(id: string): Promise<User | undefined> {
		const user = await User.dispatchQuery("SELECT * FROM users WHERE id = $1", [id]);
		return user.rows.length > 0 ? new User(user.rows[0]) : undefined;
	}

	/**
	 * Finds and returns the user with the corresponding username.
	 * @param {string} username - The username of the user.
	 */
	static async findByUsername(username: string): Promise<User | undefined> {
		const user = await User.dispatchQuery("SELECT * FROM users WHERE username = $1", [
			username,
		]);
		return user.rows.length > 0 ? new User(user.rows[0]) : undefined;
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

		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(password, salt);
		const created_at = new Date();
		const id = options.id || uuidv4();

		const user = await User.dispatchQuery(
			"INSERT INTO users(id, username, hash, created_at) VALUES($1, $2, $3, $4) RETURNING *",
			[id, validator.trim(username), hash, created_at]
		);
		return user ? new User(user.rows[0]) : undefined;
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

	static loadDispatcher(dispatcher: QueryDispatcher) {
		User.dispatcher = dispatcher;
	}

	static endDispatcher() {
		if (User.dispatcher) {
			User.dispatcher.end();
			User.dispatcher = undefined;
		}
	}
}

User.loadDispatcher(new QueryDispatcher());

export default User;
