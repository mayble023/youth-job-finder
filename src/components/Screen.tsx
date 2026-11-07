import { HeaderHeightContext } from 'expo-router/react-navigation';
import { useContext, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

export type ScreenProps = {
  children: ReactNode;
  /** Wrap content in a ScrollView. Defaults to false. */
  scroll?: boolean;
  /** Apply the standard horizontal/vertical padding. Defaults to true. */
  padded?: boolean;
  /** Safe-area edges to inset. Defaults to all edges except top (the Stack header handles it). */
  edges?: Edge[];
  /** Rendered above the content, outside the padding (e.g. OfflineBanner). */
  header?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['bottom', 'left', 'right'],
  header,
  style,
  contentContainerStyle,
}: ScreenProps) {
  // Expo apps are edge-to-edge on Android, so the window no longer resizes for the keyboard;
  // padding on both platforms (offset by any header above us) keeps inputs visible.
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const padding = padded ? styles.padded : undefined;

  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      {header}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[padding, styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, padding, contentContainerStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
