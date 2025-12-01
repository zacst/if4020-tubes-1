package middleware

import (
	"encoding/json"

	"if4020-tubes-1/backend/pkg/crypto"

	"github.com/gofiber/fiber/v2"
)

// Note: Modify according to the incoming packet structure
type IncomingPacket struct {
	EncryptedData string `json:"encryptedData"`
	Signature     struct {
		R string `json:"r"`
		S string `json:"s"`
	} `json:"signature"`
	SenderPublicKey string `json:"senderPublicKey"`
}

func IntegrityCheck(c *fiber.Ctx) error {
	// 1. Get the Body Bytes
	// Fiber stores the body in memory, so read it multiple times safely.
	bodyBytes := c.Body()

	// 2. Parse JSON to extract the fields
	var packet IncomingPacket
	if err := json.Unmarshal(bodyBytes, &packet); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid JSON format",
		})
	}

	// 3. Re-Hash the EncryptedData
	// Note: Ensure Frontend signs the HASH of 'encryptedData' string
	hash := crypto.HashMessage([]byte(packet.EncryptedData))

	// 4. Verify Signature
	valid, err := crypto.VerifySignature(
		hash,
		packet.Signature.R,
		packet.Signature.S,
		packet.SenderPublicKey,
	)

	if err != nil || !valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Integrity Check Failed: Invalid Signature",
		})
	}

	// 5. Store the public key in Locals so the next handler knows who sent this
	c.Locals("senderPubKey", packet.SenderPublicKey)

	// 6. Continue to the next handler
	return c.Next()
}
