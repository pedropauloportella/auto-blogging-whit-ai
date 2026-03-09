// Simple script to print bcrypt hash for admin password
//create your password
const bcrypt = require('bcryptjs');
const pw = process.argv[2] || 'changeme';
const hash = bcrypt.hashSync(pw, 10);
console.log('ADMIN_PW_HASH=', hash);
