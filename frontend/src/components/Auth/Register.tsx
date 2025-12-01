import React, { useState } from "react";
import { colors } from "../../theme/colors";
import { InputField } from "./InputField";
import { Button } from "./Button";
import { MessageCircle } from "lucide-react";
import { register } from "../../utils/api"; // ✅ Import API function
import { generateKeyPairFromPassword, storeKeyPair } from "../../utils/crypto";

interface RegisterProps {
  onRegister: (username: string, publicKey: string) => void;
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({
  onRegister,
  onSwitchToLogin,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!username) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsGeneratingKeys(true);
    
    try {
      // Generate key pair from password
      const keyPair = await generateKeyPairFromPassword(password);
      
      // Store keys locally first
      storeKeyPair(username, keyPair);
      
      // Send registration request using API utility
      // This automatically uses the correct BASE_URL
      const response = await register(username, keyPair.publicKey);
      const result = response.data;

      // Mark user as registered
      localStorage.setItem(`chatApp_hasRegistered_${username}`, 'true');

      // Show success message
      alert(`Registration Successful!\n\nUsername: ${username}\nUser ID: ${result.userId || 'Created'}\n\nYou can now login with your username and password.`);
      
      // Call the onRegister callback
      onRegister(username, keyPair.publicKey);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      // Handle Axios error structure
      const errorMessage = error.response?.data?.error || error.message || "Registration failed. Please try again.";
      setErrors({ 
        username: errorMessage 
      });
      
      // Clean up stored keys if registration failed
      localStorage.removeItem(`chatApp_privateKey_${username}`);
      localStorage.removeItem(`chatApp_publicKey_${username}`);
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentPrivateKey');
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: colors.bg.primary,
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: colors.bg.secondary,
          borderRadius: "12px",
          padding: "48px 40px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: colors.accent.primary,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <MessageCircle size={40} color={colors.bg.primary} />
          </div>
          <h1
            style={{
              color: colors.text.primary,
              margin: 0,
              fontSize: "28px",
              fontWeight: 500,
            }}
          >
            Create Account
          </h1>
          <p
            style={{
              color: colors.text.secondary,
              margin: "8px 0 0 0",
              fontSize: "15px",
            }}
          >
            Sign up to get started with ChatApp
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <InputField
            type="text"
            placeholder="Username"
            value={username}
            onChange={setUsername}
            error={errors.username}
            disabled={isGeneratingKeys}
          />

          <InputField
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            disabled={isGeneratingKeys}
          />

          <InputField
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
            disabled={isGeneratingKeys}
          />

          <Button
            text={isGeneratingKeys ? "Registering..." : "Create Account"}
            onClick={handleSubmit}
            variant="primary"
            disabled={isGeneratingKeys}
          />

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <span style={{ color: colors.text.secondary, fontSize: "14px" }}>
              Already have an account?{" "}
            </span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSwitchToLogin();
              }}
              style={{
                color: colors.accent.primary,
                fontSize: "14px",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};