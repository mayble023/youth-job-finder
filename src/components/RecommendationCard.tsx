import { StyleSheet, View } from 'react-native';

import { colors, radii, sizes, spacing } from '@/theme';
import type { Job } from '@/types/database';

import { AppText } from './AppText';
import { Card } from './Card';

export type RecommendationCardProps = {
  job: Pick<Job, 'title' | 'company' | 'town'>;
  score: number;
  reasons: string[];
  onPress: () => void;
};

/** A compact job card for the horizontal "Recommended for you" row. */
export function RecommendationCard({ job, score, reasons, onPress }: RecommendationCardProps) {
  return (
    <Card
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`${job.title} at ${job.company}. ${score}% match. ${reasons.join('. ')}.`}
    >
      <View style={styles.badge}>
        <AppText variant="caption" color="success" style={styles.badgeText}>
          {score}% match
        </AppText>
      </View>
      <AppText variant="subheading" numberOfLines={2}>
        {job.title}
      </AppText>
      <AppText variant="caption" numberOfLines={1}>
        {job.company} · {job.town}
      </AppText>
      {reasons.slice(0, 2).map((reason) => (
        <AppText key={reason} variant="caption" color="text" numberOfLines={2}>
          • {reason}
        </AppText>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: sizes.carouselCard,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.successLight,
  },
  badgeText: {
    fontWeight: '700',
  },
});
