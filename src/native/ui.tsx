/// <reference path="./react-native.d.ts" />
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

export interface NativePalette {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  button: string;
  buttonText: string;
  danger: string;
}

export function useNativePalette(): NativePalette {
  const scheme = useColorScheme();
  if (scheme === "dark") {
    return {
      background: "#17130e",
      surface: "#2c271f",
      text: "#f5f3f0",
      muted: "#aa9e8d",
      border: "#40382d",
      button: "#f5f3f0",
      buttonText: "#17130e",
      danger: "#f2b8b5",
    };
  }
  return {
    background: "#fbfaf9",
    surface: "#ffffff",
    text: "#2c271f",
    muted: "#867865",
    border: "#e7e2dc",
    button: "#2c271f",
    buttonText: "#fbfaf9",
    danger: "#dc2626",
  };
}

export function NativeScreen({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  const palette = useNativePalette();
  return (
    <View style={{ gap: 16, padding: 20, backgroundColor: palette.background }}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: palette.text, fontSize: 24, fontWeight: "600" }}>
          {title}
        </Text>
        {description ? (
          <Text style={{ color: palette.muted, fontSize: 15 }}>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function NativeField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
  multiline?: boolean;
}) {
  const palette = useNativePalette();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: palette.muted, fontSize: 13 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          color: palette.text,
          backgroundColor: palette.surface,
          borderColor: palette.border,
          borderWidth: 1,
          borderRadius: 10,
          minHeight: multiline ? 96 : 48,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 0,
          fontSize: 16,
        }}
      />
    </View>
  );
}

export function NativeButton({
  label,
  onPress,
  disabled = false,
  pending = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  const palette = useNativePalette();
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled || pending}
      onPress={onPress}
      style={{
        backgroundColor: palette.button,
        borderRadius: 10,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled || pending ? 0.6 : 1,
      }}
    >
      {pending ? (
        <ActivityIndicator color={palette.buttonText} />
      ) : (
        <Text
          style={{ color: palette.buttonText, fontSize: 16, fontWeight: "600" }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function NativeToggle({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const palette = useNativePalette();
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        onChange(!checked);
      }}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: checked ? palette.button : palette.surface,
        }}
      />
      <Text style={{ color: palette.text, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function NativeError({ message }: { message: string | null }) {
  const palette = useNativePalette();
  if (!message) return null;
  return <Text style={{ color: palette.danger, fontSize: 14 }}>{message}</Text>;
}
