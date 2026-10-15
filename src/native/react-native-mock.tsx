import { createElement, type ReactNode } from "react";

export function View({ children }: { children?: ReactNode }) {
  return createElement("div", null, children);
}

export function Text({ children }: { children?: ReactNode }) {
  return createElement("span", null, children);
}

export function ScrollView({ children }: { children?: ReactNode }) {
  return createElement("div", null, children);
}

export function ActivityIndicator() {
  return createElement("span", null, "loading");
}

export function Image() {
  return createElement("img", null);
}

export function TextInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}: {
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}) {
  return createElement("input", {
    value,
    placeholder,
    type: secureTextEntry ? "password" : "text",
    onChange: (event: { target: { value: string } }) => {
      onChangeText?.(event.target.value);
    },
  });
}

export function Pressable({
  children,
  onPress,
  accessibilityLabel,
}: {
  children?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return createElement(
    "button",
    { type: "button", "aria-label": accessibilityLabel, onClick: onPress },
    children,
  );
}

export function useColorScheme(): "light" {
  return "light";
}
