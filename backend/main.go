package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"if4020-tubes-1/backend/internal/database"
	"if4020-tubes-1/backend/internal/handlers"
	"if4020-tubes-1/backend/internal/middleware"
)

func main() {
	// 1. Connect to Database
	database.Connect()

	// 2. Initialize Fiber
	app := fiber.New()

	// =================================================================
	// 3. MIDDLEWARE (CRITICAL SECTION)
	// =================================================================
	
	app.Use(recover.New())
	app.Use(logger.New())

	app.Use(cors.New(cors.Config{
		// Allow your localhost AND any ngrok url
		AllowOrigins: "http://localhost:5173, http://localhost:8080", 
		// Allow the headers React sends
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		// CRITICAL: Explicitly allow OPTIONS (The Preflight Request)
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
		// Allow credentials if you use cookies (optional, but good practice)
		AllowCredentials: true,
	}))

	// =================================================================
	// 4. ROUTES
	// =================================================================

	// Auth Routes
	auth := app.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login/challenge", handlers.LoginChallenge)
	auth.Post("/login/verify", handlers.LoginVerify)

	// Protected API Routes
	api := app.Group("/api", middleware.Protected())
	api.Get("/contacts", handlers.GetContacts)
	api.Post("/contacts/add", handlers.AddContact)
	api.Get("/users/search", handlers.SearchUsers)
	api.Post("/chat/send", handlers.SendMessage)
	api.Get("/chat/history", handlers.GetMessages)

	// =================================================================
	// 5. DEPLOYMENT / STATIC FILES
	// =================================================================
	
	// Serve the React build
	app.Static("/", "./dist")

	// Catch-all for React Router
	app.Get("*", func(c *fiber.Ctx) error {
		return c.SendFile("./dist/index.html")
	})

	// 6. Start Server
	log.Println("Server running on port 8080")
	log.Fatal(app.Listen(":8080"))
}