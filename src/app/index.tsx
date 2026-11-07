// TEMPORARY: component showcase for checking the design system in Expo Go.
// Replace with the real home screen in Prompt 3.
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineBanner,
  Screen,
  TextField,
} from "@/components";
import { colors, radii, spacing, typography, type ColorToken, type TypographyVariant } from "@/theme";

const FILTERS = ["Full-time", "Part-time", "Internship", "Volunteer"];
const SKILLS = ["Customer service", "Excel", "Driving licence", "Tok Pisin", "Carpentry"];

export default function DemoScreen() {
  const [offline, setOffline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [selected, setSelected] = useState<string[]>(["Full-time"]);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");

  const nameError = name.length > 0 && name.trim().length < 2 ? "Name must be at least 2 characters." : null;

  const fakeRequest = (setBusy: (busy: boolean) => void) => {
    setBusy(true);
    setTimeout(() => setBusy(false), 1500);
  };

  const toggle = (label: string) =>
    setSelected((prev) => (prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]));

  return (
    <Screen scroll header={<OfflineBanner visible={offline} />}>
      <View style={styles.stack}>
        <Section title="Colours">
          <View style={styles.swatches}>
            {(Object.keys(colors) as ColorToken[])
              .filter((key) => key !== "overlay")
              .map((key) => (
                <View key={key} style={styles.swatchItem}>
                  <View style={[styles.swatch, { backgroundColor: colors[key] }]} />
                  <AppText variant="caption">{key}</AppText>
                </View>
              ))}
          </View>
        </Section>

        <Section title="AppText">
          {(Object.keys(typography) as TypographyVariant[]).map((variant) => (
            <AppText key={variant} variant={variant}>
              {variant} — Find your first job
            </AppText>
          ))}
        </Section>

        <Section title="Button">
          <Button title="Primary" icon="search" onPress={() => fakeRequest(setLoading)} loading={loading} />
          <Button title="Secondary" variant="secondary" />
          <Button title="Danger" variant="danger" icon="trash-outline" />
          <Button title="Ghost" variant="ghost" />
          <Button title="Disabled" disabled />
        </Section>

        <Section title="TextField">
          <TextField
            label="Full name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Kila Wari"
            error={nameError}
            autoCapitalize="words"
          />
          <TextField
            label="About you"
            value={about}
            onChangeText={setAbout}
            placeholder="Tell employers about yourself"
            hint="Keep it short and friendly."
            multiline
            maxLength={200}
          />
          <TextField label="Email" value="not-an-email" onChangeText={() => {}} error="Enter a valid email address." />
        </Section>

        <Section title="Chip">
          <AppText variant="caption">Filters (tap to toggle)</AppText>
          <View style={styles.wrap}>
            {FILTERS.map((f) => (
              <Chip key={f} label={f} selected={selected.includes(f)} onPress={() => toggle(f)} />
            ))}
          </View>
          <AppText variant="caption">Skills (static)</AppText>
          <View style={styles.wrap}>
            {SKILLS.map((s) => (
              <Chip key={s} label={s} icon="ribbon-outline" />
            ))}
          </View>
        </Section>

        <Section title="Card">
          <Card onPress={() => {}} accessibilityLabel="Shop Assistant at Boroko Foodworld">
            <AppText variant="subheading">Shop Assistant</AppText>
            <AppText variant="body" color="textMuted">
              Boroko Foodworld · Port Moresby
            </AppText>
            <View style={styles.wrap}>
              <Chip label="Full-time" />
              <Chip label="Entry level" />
            </View>
          </Card>
        </Section>

        <Section title="OfflineBanner">
          <Button
            title={offline ? "Hide offline banner" : "Show offline banner"}
            variant="ghost"
            icon="wifi"
            onPress={() => setOffline((v) => !v)}
          />
        </Section>

        <Section title="LoadingState">
          <Frame>
            <LoadingState message="Finding jobs near you…" />
          </Frame>
        </Section>

        <Section title="EmptyState">
          <Frame>
            <EmptyState
              icon="briefcase-outline"
              title="No saved jobs yet"
              message="Tap the bookmark on a job to save it for later."
              action={{ label: "Browse jobs", onPress: () => {} }}
            />
          </Frame>
        </Section>

        <Section title="ErrorState">
          <Frame>
            <ErrorState
              message="We couldn't load jobs. Check your connection and try again."
              onRetry={() => fakeRequest(setRetrying)}
              retrying={retrying}
            />
          </Frame>
        </Section>
      </View>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading">{title}</AppText>
      {children}
    </View>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return <View style={styles.frame}>{children}</View>;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  swatchItem: {
    width: 88,
    gap: spacing.xs,
  },
  swatch: {
    height: 40,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  frame: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
