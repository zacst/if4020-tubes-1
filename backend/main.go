package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"

	"if4020-tubes-1/backend/internal/database"
	"if4020-tubes-1/backend/internal/handlers"
	"if4020-tubes-1/backend/internal/middleware"
)

func main() {
	// 1. Connect to Database
	database.Connect()

	// 2. Initialize Fiber
	app := fiber.New()

	// 3. Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// 4. Routes
	auth := app.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login/challenge", handlers.LoginChallenge)
	auth.Post("/login/verify", handlers.LoginVerify)

	api := app.Group("/api", middleware.Protected())

	// Contacts
	api.Get("/contacts", handlers.GetContacts)
	api.Post("/contacts/add", handlers.AddContact)
	api.Get("/users/search", handlers.SearchUsers)

	// Chat
	api.Post("/chat/send", handlers.SendMessage)
	api.Get("/chat/history", handlers.GetMessages)

	// 5. Start Server
	app.Listen(":3000")
}
