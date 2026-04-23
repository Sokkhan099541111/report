import mysql from 'mysql2/promise';

const connection = mysql.createPool({
    host: process.env.DB_HOST || 'report.mangotracking.com',
    user: process.env.DB_USER || 'mangotracking_api',
    password: process.env.DB_PASSWORD || 'Sok@$#$2026',
    database: process.env.DB_NAME || 'mangotracking_api',
});
  // host: process.env.DB_HOST || '74.48.72.98',
export default connection;


// import mysql from 'mysql2/promise';

// const connection = mysql.createPool({
//     host: process.env.DB_HOST || '127.0.0.1',
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || '',
//     database: process.env.DB_NAME || 'mangotracking_api',
// });
//   // host: process.env.DB_HOST || '74.48.72.98',
// export default connection;


