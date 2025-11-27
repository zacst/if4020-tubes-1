import React, { useState } from "react";
import { colors } from "../../theme/colors";
import { InputField } from "./InputField";
import { Button } from "./Button";
import { MessageCircle } from "lucide-react";

interface RegisterProps {
  onRegister: (username: string, password: string) => void;
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({
  onRegister,
  onSwitchToLogin,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    } else if (username.length < 5) {
      newErrors.username = "Name must be at least 5 characters";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onRegister(username, password);
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
          />

          <InputField
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            error={errors.password}
          />

          <InputField
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
          />

          <Button
            text="Create Account"
            onClick={handleSubmit}
            variant="primary"
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

        <div
          style={{
            marginTop: "24px",
            padding: "12px",
            backgroundColor: colors.bg.tertiary,
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: colors.text.secondary,
              fontSize: "13px",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};
