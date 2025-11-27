import React from 'react';
import { colors } from '../../theme/colors';

interface InputFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ type, placeholder, value, onChange, error }) => {
  return (
    <div style={{ width: '100%' }}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '14px 16px',
          backgroundColor: colors.bg.tertiary,
          border: `1px solid ${error ? colors.error : colors.border}`,
          borderRadius: '8px',
          color: colors.text.primary,
          fontSize: '15px',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = colors.accent.primary;
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? colors.error : colors.border;
        }}
      />
      {error && (
        <div style={{ color: colors.error, fontSize: '13px', marginTop: '6px', marginLeft: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
};