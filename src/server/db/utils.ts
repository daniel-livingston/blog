import { Pool, QueryResult } from "pg";

export const dispatchQuery = async (query: string, values: any[]) => {
	const pool = new Pool();
	const client = await pool.connect();
	let data: QueryResult | undefined;
	try {
		data = await client.query(query, values);
		client.release();
		return data;
	} finally {
		pool.end();
		return data;
	}
};

export const initializeUserDatabase = async () => {
	await dispatchQuery("DROP TABLE IF EXISTS users", []);
	await dispatchQuery(
		"CREATE TABLE users (" +
			"id UUID PRIMARY KEY, " +
			"username VARCHAR(16) UNIQUE, " +
			"hash TEXT," +
			"created_at TIMESTAMPTZ" +
			")",
		[]
	);
};
