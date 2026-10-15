declare module "react-native" {
  import type { ComponentType, ReactNode } from "react";

  interface NodeProps {
    children?: ReactNode;
    style?: unknown;
  }

  export const View: ComponentType<NodeProps & { style?: unknown }>;
  export const Text: ComponentType<NodeProps>;
  export const ScrollView: ComponentType<
    NodeProps & { contentContainerStyle?: unknown }
  >;
  export const ActivityIndicator: ComponentType<{ color?: string }>;
  export const Image: ComponentType<{
    source: { uri: string };
    style?: unknown;
    accessibilityLabel?: string;
  }>;
  export const TextInput: ComponentType<{
    value?: string;
    onChangeText?: (value: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    keyboardType?: "default" | "email-address" | "number-pad";
    style?: unknown;
  }>;
  export const Pressable: ComponentType<{
    children?: ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    style?: unknown;
    accessibilityLabel?: string;
  }>;
  export function useColorScheme(): "light" | "dark" | null | undefined;
}
