
CREATE TABLE IF NOT EXISTS plugin_phones (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	id_user INTEGER,
	name VARCHAR(50) NOT NULL,
	code VARCHAR(50) NOT NULL,
	freeapi_login VARCHAR(50) NOT NULL,
	freeapi_key VARCHAR(50) NOT NULL,
	FOREIGN KEY(id_user) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);