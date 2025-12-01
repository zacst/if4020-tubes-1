package handlers

import (
	"if4020-tubes-1/backend/internal/database"
	"if4020-tubes-1/backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

func GetContacts(c *fiber.Ctx) error {
	username := c.Locals("username").(string) // Set by JWT middleware

	rows, err := database.DB.Query(`
		SELECT u.id, u.username, u.public_key 
		FROM users u 
		JOIN contacts c ON u.id = c.contact_id 
		JOIN users me ON c.user_id = me.id 
		WHERE me.username = ?`, username)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	var contacts []models.Contact
	for rows.Next() {
		var contact models.Contact
		if err := rows.Scan(&contact.ID, &contact.Username, &contact.PublicKey); err != nil {
			continue
		}
		contacts = append(contacts, contact)
	}

	return c.JSON(contacts)
}

func AddContact(c *fiber.Ctx) error {
	username := c.Locals("username").(string)
	type Request struct {
		ContactUsername string `json:"contactUsername"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Get IDs
	var userID, contactID int
	err := database.DB.QueryRow("SELECT id FROM users WHERE username = ?", username).Scan(&userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "User not found"})
	}
	err = database.DB.QueryRow("SELECT id FROM users WHERE username = ?", req.ContactUsername).Scan(&contactID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Contact not found"})
	}

	_, err = database.DB.Exec("INSERT INTO contacts (user_id, contact_id) VALUES (?, ?)", userID, contactID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not add contact"})
	}

	return c.JSON(fiber.Map{"status": "Contact added"})
}

func SearchUsers(c *fiber.Ctx) error {
	query := c.Query("q")
	if query == "" {
		return c.JSON([]models.User{})
	}

	rows, err := database.DB.Query("SELECT id, username, public_key FROM users WHERE username LIKE ?", "%"+query+"%")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.Username, &user.PublicKey); err != nil {
			continue
		}
		users = append(users, user)
	}
	return c.JSON(users)
}
