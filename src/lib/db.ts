import mysql from "mysql2/promise";
import "server-only";
import { APP_UTC_OFFSET } from "./timezone";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // DATETIME/DATE dibaca & ditulis sebagai WIB (GMT+7)
  timezone: APP_UTC_OFFSET,
});

// NOW(), CURDATE(), CURRENT_TIMESTAMP di MySQL ikut WIB
pool.pool.on("connection", (connection) => {
  connection.query(`SET time_zone = '${APP_UTC_OFFSET}'`);
});

export default pool;
