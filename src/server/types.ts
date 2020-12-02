export interface UserConfig {
	id?: string;
	name?: string;
}

export interface UserDetails {
	id: string;
	username: string;
	hash: string;
	created_at: Date;
}

export interface UserCredentials {
	username: string;
	password: string;
}

export interface UserSearchOptions {
	id: string;
	username: string;
	name: string;
}
