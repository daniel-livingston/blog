import { Pool, QueryResult } from "pg";

class QueryDispatcher {
	private pool: Pool;

	constructor() {
		this.pool = new Pool();
	}

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

	end() {
		this.pool.end();
	}
}

export default QueryDispatcher;
