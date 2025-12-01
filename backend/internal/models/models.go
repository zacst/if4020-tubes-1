package models

type User struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	PublicKey string `json:"publicKey"`
}

type Contact struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	PublicKey string `json:"publicKey"`
}

type Message struct {
	ID               int    `json:"id"`
	SenderUsername   string `json:"sender_username"`
	ReceiverUsername string `json:"receiver_username"`
	EncryptedMessage string `json:"encrypted_message"`
	MessageHash      string `json:"message_hash"`
	SignatureR       string `json:"signature_r"`
	SignatureS       string `json:"signature_s"`
	Timestamp        string `json:"timestamp"`
}
