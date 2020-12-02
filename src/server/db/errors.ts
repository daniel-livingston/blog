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
