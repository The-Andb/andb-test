const sqlite3 = require('better-sqlite3');
const db = new sqlite3('/Volumes/FlexibleWorkplace/side-pr/andb-storage.db');
const row = db.prepare("SELECT export_name, ddl_content FROM ddl_exports WHERE export_name='access_token' LIMIT 1").get();

if (!row) {
    console.log("Row not found.");
    process.exit(1);
}

const ddl = row.ddl_content;
const columns = [];
const lines = ddl.split('\n');

lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.toUpperCase().startsWith('CREATE') || 
        trimmed.toUpperCase().startsWith('PRIMARY') || 
        trimmed.toUpperCase().startsWith('KEY') || 
        trimmed.toUpperCase().startsWith('CONSTRAINT') || 
        trimmed.toUpperCase().startsWith('UNIQUE') || 
        trimmed.toUpperCase().startsWith('INDEX') || 
        trimmed.toUpperCase().startsWith('FOREIGN') || 
        trimmed.startsWith(')') || trimmed.startsWith('(') || !trimmed) {
        return;
    }
    const match = trimmed.match(/^[\`\"]?([a-zA-Z0-9_]+)[\`\"]?\s+([a-zA-Z0-9_()]+)/i);
    if (match) {
        columns.push({ name: match[1], type: match[2].toLowerCase(), pk: trimmed.toUpperCase().includes('PRIMARY KEY') });
    } else {
        console.log('No match for line:', trimmed);
    }
});

console.log(`Parsed ${columns.length} columns:`);
console.log(columns);
