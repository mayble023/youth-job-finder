import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/theme";

import { AppText } from "./AppText";
import { Button } from "./Button";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText variant="body" color="textMuted" align="center">
        {message}
      </AppText>
    </View>
  );
}

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ icon = "file-tray-outline", title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <AppText variant="subheading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color="textMuted" align="center">
          {message}
        </AppText>
      ) : null}
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

export type ErrorStateProps = {
  message: string;
  title?: string;
  onRetry: () => void;
  /** Pass true while the retry request is in flight. */
  retrying?: boolean;
};

export function ErrorState({
  message,
  title = "Something went wrong",
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
      <AppText variant="subheading" align="center">
        {title}
      </AppText>
      <AppText variant="body" color="textMuted" align="center">
        {message}
      </AppText>
      <Button
        title="Retry"
        icon="refresh"
        onPress={onRetry}
        loading={retrying}
        fullWidth={false}
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  action: {
    marginTop: spacing.sm,
  },
});
