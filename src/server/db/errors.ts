/**
 * Defines the error that is thrown on receiving an invalid username.
 */
export class InvalidPasswordError extends Error {
	errors: string[];
	constructor(errors: string[]) {
		super();
		this.name = "InvalidPasswordError";
		this.message = `Invalid password provided`;
		this.errors = errors;
	}
}

/**
 * Defines the error that is thrown when an invalid input is provided to the database.
 */
export class InvalidInputError extends Error {
	constructor() {
		super();
		this.name = "InvalidInputError";
		this.message = "An invalid input was provided";
	}
}

/**
 * Defines the error that is thrown on receiving an invalid username.
 */
export class InvalidUsernameError extends Error {
	errors: string[];
	constructor(errors: string[]) {
		super();
		this.name = "InvalidUsernameError";
		this.message = `Invalid username provided`;
		this.errors = errors;
	}
}

/**
 * Defines the error that is thrown on attempting to create a user with a username that is already in use.
 */
export class UsernameInUseError extends Error {
	constructor() {
		super();
		this.name = "UsernameInUseError";
		this.message = "Username is already in use";
	}
}
