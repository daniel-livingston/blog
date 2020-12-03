/**
 * Additional information that can be specified about the user.
 */
export interface UserConfig {
	id?: string;
	name?: string;
}

/**
 * The details of the user that will be publicly shown when converted to JSON.
 */
export interface UserDetails extends UserConfig {
	id: string;
	username: string;
	hash: string;
	created_at: Date;
}

/**
 * The credentials needed for the user to authenticate themselves.
 */
export interface UserCredentials {
	username: string;
	password: string;
}
