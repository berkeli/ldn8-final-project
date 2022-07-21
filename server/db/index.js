import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();
const connectionString = process.env.DATABASE_URL1;

const pool = new Pool({
	connectionString,
	ssl: {
		rejectUnauthorized: false,
	},
});

export default pool;
