package handlers

import (
	"if4020-tubes-1/backend/internal/database"
	"if4020-tubes-1/backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

func SendMessage(c *fiber.Ctx) error {
	var msg models.Message
	if err := c.BodyParser(&msg); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	_, err := database.DB.Exec(`
		INSERT INTO messages (sender_username, receiver_username, encrypted_message, message_hash, signature_r, signature_s, timestamp)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		msg.SenderUsername, msg.ReceiverUsername, msg.EncryptedMessage, msg.MessageHash, msg.SignatureR, msg.SignatureS, msg.Timestamp)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not save message"})
	}

	return c.JSON(fiber.Map{"status": "Message sent"})
}

func GetMessages(c *fiber.Ctx) error {
	username := c.Locals("username").(string)
	contactUsername := c.Query("contact")

	rows, err := database.DB.Query(`
		SELECT id, sender_username, receiver_username, encrypted_message, message_hash, signature_r, signature_s, timestamp
		FROM messages
		WHERE (sender_username = ? AND receiver_username = ?)
		OR (sender_username = ? AND receiver_username = ?)
		ORDER BY timestamp ASC`,
		username, contactUsername, contactUsername, username)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		if err := rows.Scan(&msg.ID, &msg.SenderUsername, &msg.ReceiverUsername, &msg.EncryptedMessage, &msg.MessageHash, &msg.SignatureR, &msg.SignatureS, &msg.Timestamp); err != nil {
			continue
		}
		messages = append(messages, msg)
	}

	return c.JSON(messages)
}
