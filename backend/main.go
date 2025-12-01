package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"

	"chat-app-backend/internal/middleware"

	_ "modernc.org/sqlite"
)

var db *sql.DB

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	PublicKey string    `json:"public_key"`
	CreatedAt time.Time `json:"created_at"`
}

type RegisterRequest struct {
	Username  string `json:"username"`
	PublicKey string `json:"publicKey"`
}

type ChallengeRequest struct {
	Username string `json:"username"`
}

type ChallengeResponse struct {
	Challenge string `json:"challenge"`
	Message   string `json:"message,omitempty"`
}

type LoginRequest struct {
	Username  string `json:"username"`
	Challenge string `json:"challenge"`
	Signature string `json:"signature"`
}

type LoginResponse struct {
	Message string `json:"message"`
	Token   string `json:"token"`
	User    string `json:"user,omitempty"`
}

func initDB() error {
	var err error
	db, err = sql.Open("sqlite", "./chat.db")
	if err != nil {
		return err
	}

	if err = db.Ping(); err != nil {
		return err
	}

	createTableSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		public_key TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		return err
	}

	log.Println("Database initialized")

	var userCount int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	log.Printf("Existing users: %d", userCount)

	return nil
}

func registerHandler(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Username == "" || req.PublicKey == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Username and public key are required",
		})
	}

	if len(req.Username) < 3 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Username must be at least 3 characters",
		})
	}

	result, err := db.Exec(
		"INSERT INTO users (username, public_key) VALUES (?, ?)",
		req.Username, req.PublicKey,
	)
	if err != nil {
		return c.Status(409).JSON(fiber.Map{
			"error": "Username already exists",
		})
	}

	userID, _ := result.LastInsertId()

	return c.Status(201).JSON(fiber.Map{
		"message":  "User registered successfully",
		"userId":   userID,
		"username": req.Username,
	})
}

func challengeHandler(c *fiber.Ctx) error {
	var req ChallengeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var user User
	err := db.QueryRow(
		"SELECT username, public_key FROM users WHERE username = ?",
		req.Username,
	).Scan(&user.Username, &user.PublicKey)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "User not found. Please register first.",
		})
	}

	challengeBytes := make([]byte, 32)
	if _, err := rand.Read(challengeBytes); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	challenge := hex.EncodeToString(challengeBytes)

	return c.JSON(ChallengeResponse{
		Challenge: challenge,
		Message:   "Challenge generated successfully",
	})
}

func loginHandler(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var publicKey string
	err := db.QueryRow(
		"SELECT public_key FROM users WHERE username = ?",
		req.Username,
	).Scan(&publicKey)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	token := generateSessionToken(req.Username)

	return c.JSON(LoginResponse{
		Message: "Login successful",
		Token:   token,
		User:    req.Username,
	})
}

func generateSessionToken(username string) string {
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)
	randomPart := hex.EncodeToString(randomBytes)

	token := struct {
		User      string `json:"user"`
		Token     string `json:"token"`
		ExpiresAt int64  `json:"expires_at"`
	}{
		User:      username,
		Token:     randomPart,
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
	}

	tokenJSON, _ := json.Marshal(token)
	return hex.EncodeToString(tokenJSON)
}

func getUsersHandler(c *fiber.Ctx) error {
	rows, err := db.Query("SELECT id, username, public_key, created_at FROM users")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to query users",
		})
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Username, &user.PublicKey, &user.CreatedAt)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	return c.JSON(fiber.Map{
		"users": users,
		"count": len(users),
	})
}

func main() {
	if err := initDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	app := fiber.New()

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	auth := app.Group("/auth")

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Server is running",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	app.Get("/debug/users", getUsersHandler)

	auth.Post("/register", registerHandler)
	auth.Post("/login/challenge", challengeHandler)
	auth.Post("/login", loginHandler)

	secure := app.Group("/api", middleware.IntegrityCheck)

	secure.Get("/contacts", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"contacts": []string{"Alice", "Bob", "Charlie"},
		})
	})

	secure.Post("/contacts/add", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "Contact added"})
	})

	secure.Post("/chat/send", func(c *fiber.Ctx) error {
		sender := c.Locals("senderPubKey").(string)

		type MsgRequest struct {
			EncryptedData string `json:"encryptedData"`
		}
		var req MsgRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).SendString("Bad Request")
		}

		return c.JSON(fiber.Map{
			"status": "Message sent",
			"from":   sender,
		})
	})

	log.Println("Server running on http://localhost:3000")
	log.Fatal(app.Listen(":3000"))
}
