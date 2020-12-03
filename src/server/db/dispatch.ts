import { Pool, QueryResult } from "pg";

/**
 * An object that handles dispatching SQL queries to the Postgres database
 */
class QueryDispatcher {
	private pool: Pool;

	constructor() {
		this.pool = new Pool();
	}

	/**
	 * Dispatches the SQL query to the database
	 * @param query - SQL query string
	 * @param values - Array of values to inject into the SQL query
	 */
	async dispatch(query: string, values: any[]): Promise<QueryResult | undefined> {
		const client = await this.pool.connect();
		let data: QueryResult | undefined;
		try {
			data = await client.query(query, values);
		} finally {
			client.release();
			return data;
		}
	}

	/**
	 * Shuts down the dispatcher
	 */
	end() {
		this.pool.end();
	}
}

export default QueryDispatcher;
