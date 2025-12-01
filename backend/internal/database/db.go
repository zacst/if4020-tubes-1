package database

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Connect() {
	var err error
	DB, err = sql.Open("sqlite3", "./chat.db")
	if err != nil {
		log.Fatal(err)
	}

	createTables()
}

func createTables() {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE,
		public_key TEXT
	);
	CREATE TABLE IF NOT EXISTS contacts (
		user_id INTEGER,
		contact_id INTEGER,
		PRIMARY KEY (user_id, contact_id),
		FOREIGN KEY(user_id) REFERENCES users(id),
		FOREIGN KEY(contact_id) REFERENCES users(id)
	);
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sender_username TEXT,
		receiver_username TEXT,
		encrypted_message TEXT,
		message_hash TEXT,
		signature_r TEXT,
		signature_s TEXT,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := DB.Exec(query)
	if err != nil {
		log.Fatal(err)
	}
}
