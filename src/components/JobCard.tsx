import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors, iconSizes, spacing } from '@/theme';
import type { Job } from '@/types/database';
import { formatClosingDate, formatSalaryRange } from '@/utils/format';

import { AppText } from './AppText';
import { Card } from './Card';

export type JobCardProps = {
  job: Pick<
    Job,
    'title' | 'company' | 'town' | 'job_type' | 'salary_min' | 'salary_max' | 'closing_date'
  >;
  onPress: () => void;
};

export function JobCard({ job, onPress }: JobCardProps) {
  const closing = formatClosingDate(job.closing_date);

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${job.title} at ${job.company}, ${job.town}. ${closing}.`}
    >
      <AppText variant="subheading">{job.title}</AppText>
      <AppText color="textMuted">{job.company}</AppText>
      <View style={styles.row}>
        <Meta icon="location-outline" text={job.town} />
        <Meta icon="briefcase-outline" text={job.job_type} />
      </View>
      <Meta icon="cash-outline" text={formatSalaryRange(job.salary_min, job.salary_max)} />
      <Meta icon="time-outline" text={closing} />
    </Card>
  );
}

function Meta({
  icon,
  text,
}: {
  icon: 'location-outline' | 'briefcase-outline' | 'cash-outline' | 'time-outline';
  text: string;
}) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={iconSizes.sm} color={colors.textMuted} />
      <AppText variant="caption" style={styles.metaText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.lg,
    rowGap: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  metaText: {
    flexShrink: 1,
  },
});
