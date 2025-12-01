package crypto

import (
	"encoding/hex"
	"fmt"

	"github.com/ethereum/go-ethereum/crypto" // Handles secp256k1
	"golang.org/x/crypto/sha3"               // Handles SHA3
)

// HashMessage uses SHA3-256
func HashMessage(data []byte) []byte {
	// sha3.Sum256 returns an array [32]byte, convert to slice
	hash := sha3.Sum256(data)
	return hash[:]
}

// VerifySignature checks if the signature matches the hash and public key
func VerifySignature(hash []byte, rHex, sHex, pubKeyHex string) (bool, error) {
	// 1. Decode inputs
	pubKeyBytes, err := hex.DecodeString(pubKeyHex)
	if err != nil {
		return false, fmt.Errorf("invalid public key hex")
	}
	rBytes, err := hex.DecodeString(rHex)
	if err != nil {
		return false, err
	}
	sBytes, err := hex.DecodeString(sHex)
	if err != nil {
		return false, err
	}

	// 2. Combine R and S [R || S]
	signature := append(rBytes, sBytes...)

	// 3. Verify using go-ethereum's crypto (Handles secp256k1)
	// Note: Strip the last byte if signature contained 'v', but here we manually built R+S (64 bytes)
	return crypto.VerifySignature(pubKeyBytes, hash, signature), nil
}