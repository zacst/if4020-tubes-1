package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	
	"if4020-tubes-1/backend/internal/middleware"
)

func main() {
	// 1. Initialize Fiber
	app := fiber.New()

	// 2. Middleware (Logging & CORS)
	app.Use(logger.New())
	app.Use(cors.New()) // Allow Frontend to talk to Backend

	// ---------------------------------------------------------
	// PUBLIC ROUTES (Auth)
	// ---------------------------------------------------------
	auth := app.Group("/auth")

	auth.Post("/register", func(c *fiber.Ctx) error {
		// TODO: Save user to DB (Username + Public Key)
		return c.JSON(fiber.Map{"status": "User registered"})
	})

	auth.Post("/login", func(c *fiber.Ctx) error {
		// TODO: Verify user exists. 
		// Note: In this crypto architecture, the client needs to prove they own the Private Key via a challenge/response.
		return c.JSON(fiber.Map{"status": "Challenge issued"})
	})

	// ---------------------------------------------------------
	// PROTECTED ROUTES (Requires Signature)
	// ---------------------------------------------------------
	
	// Create the group and apply the Integrity Check Middleware
	secure := app.Group("/api", middleware.IntegrityCheck)

	// A. Contact List Management
	secure.Get("/contacts", func(c *fiber.Ctx) error {
		// requester := c.Locals("senderPubKey")
		// TODO: Fetch contacts for this public key from DB
		return c.JSON(fiber.Map{
			"contacts": []string{"Alice", "Bob", "Charlie"},
		})
	})

	secure.Post("/contacts/add", func(c *fiber.Ctx) error {
		// TODO: Add new contact to user's list
		return c.JSON(fiber.Map{"status": "Contact added"})
	})

	// B. Messaging
	secure.Post("/chat/send", func(c *fiber.Ctx) error {
		// 1. We know the signature is valid because of Middleware
		sender := c.Locals("senderPubKey").(string)
		
		// 2. We need to parse the body again to get the data
		type MsgRequest struct {
			EncryptedData string `json:"encryptedData"`
		}
		var req MsgRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).SendString("Bad Request")
		}

		// 3. Logic: Store message in DB
		// Note: We store it ENCRYPTED. Only the recipient can read it.
		// DB Record: From: sender, Content: req.EncryptedData
		
		return c.JSON(fiber.Map{
			"status": "Message sent", 
			"from": sender,
		})
	})

	// 4. Start Server
	app.Listen(":3000")
}