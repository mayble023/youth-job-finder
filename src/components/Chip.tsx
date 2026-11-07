import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet } from "react-native";

import { colors, radii, spacing } from "@/theme";

import { AppText } from "./AppText";

export type ChipProps = {
  label: string;
  selected?: boolean;
  /** Omit to render a static (non-pressable) chip, e.g. a skill tag. */
  onPress?: () => void;
  icon?: ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
};

export function Chip({ label, selected = false, onPress, icon, disabled = false }: ChipProps) {
  const fg = selected ? colors.primary : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? "togglebutton" : "text"}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      hitSlop={spacing.xs}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {selected ? (
        <Ionicons name="checkmark" size={16} color={fg} />
      ) : icon ? (
        <Ionicons name={icon} size={16} color={fg} />
      ) : null}
      <AppText variant="caption" style={[styles.label, { color: fg }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: "600",
  },
});
