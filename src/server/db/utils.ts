import QueryDispatcher from "./dispatch";

/**
 * Resets the 'users' database
 * @param dispatcher - QueryDispatcher object to handle SQL queries
 */
export const initializeUserDatabase = async (dispatcher: QueryDispatcher) => {
	await dispatcher.dispatch("DROP TABLE IF EXISTS users", []);
	await dispatcher.dispatch(
		"CREATE TABLE users (" +
			"id UUID PRIMARY KEY, " +
			"username VARCHAR(16) UNIQUE, " +
			"hash TEXT," +
			"created_at TIMESTAMPTZ" +
			")",
		[]
	);
};
