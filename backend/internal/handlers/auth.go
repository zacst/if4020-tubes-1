package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"if4020-tubes-1/backend/internal/database"
	"if4020-tubes-1/backend/pkg/crypto"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

var nonceStore = struct {
	sync.RWMutex
	m map[string]string
}{m: make(map[string]string)}

func Register(c *fiber.Ctx) error {
	type Request struct {
		Username  string `json:"username"`
		PublicKey string `json:"publicKey"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	result, err := database.DB.Exec("INSERT INTO users (username, public_key) VALUES (?, ?)", req.Username, req.PublicKey)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not register user"})
	}

	id, _ := result.LastInsertId()
	return c.JSON(fiber.Map{"status": "User registered", "userId": id})
}

func LoginChallenge(c *fiber.Ctx) error {
	type Request struct {
		Username string `json:"username"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Check if user exists
	var exists int
	err := database.DB.QueryRow("SELECT 1 FROM users WHERE username = ?", req.Username).Scan(&exists)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Generate Nonce
	bytes := make([]byte, 32)
	rand.Read(bytes)
	nonce := hex.EncodeToString(bytes)

	nonceStore.Lock()
	nonceStore.m[req.Username] = nonce
	nonceStore.Unlock()

	return c.JSON(fiber.Map{"nonce": nonce})
}

func LoginVerify(c *fiber.Ctx) error {
	type Request struct {
		Username  string `json:"username"`
		Signature struct {
			R string `json:"r"`
			S string `json:"s"`
		} `json:"signature"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	nonceStore.RLock()
	nonce, ok := nonceStore.m[req.Username]
	nonceStore.RUnlock()

	if !ok {
		return c.Status(400).JSON(fiber.Map{"error": "No pending login request"})
	}

	// Get User Public Key
	var publicKey string
	err := database.DB.QueryRow("SELECT public_key FROM users WHERE username = ?", req.Username).Scan(&publicKey)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	// Verify Signature
	// Note: The client signs the HASH of the nonce usually.
	// Let's assume client signs Hash(nonce).
	hash := crypto.HashMessage([]byte(nonce))
	valid, err := crypto.VerifySignature(hash, req.Signature.R, req.Signature.S, publicKey)
	if err != nil || !valid {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid signature"})
	}

	// Generate JWT
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["username"] = req.Username
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, err := token.SignedString([]byte("secret")) // TODO: Use env var
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not login"})
	}

	// Clear nonce
	nonceStore.Lock()
	delete(nonceStore.m, req.Username)
	nonceStore.Unlock()

	return c.JSON(fiber.Map{"token": t, "username": req.Username, "publicKey": publicKey})
}
