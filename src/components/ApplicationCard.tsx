import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';
import type { Application, Job } from '@/types/database';
import { APPLICATION_STATUS_LABELS } from '@/utils/applications';
import { formatDate, formatDateTime } from '@/utils/format';

import { AppText } from './AppText';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

export type ApplicationCardProps = {
  application: Pick<Application, 'status' | 'created_at' | 'interview_at'> & {
    job: Pick<Job, 'title' | 'company' | 'town'> | null;
  };
  onPress: () => void;
};

export function ApplicationCard({ application, onPress }: ApplicationCardProps) {
  const { job, status } = application;
  // Deleting a job also deletes its applications, but stay safe if the join ever comes back empty.
  const title = job?.title ?? 'Job no longer listed';

  return (
    <Card onPress={onPress} accessibilityLabel={`${title}. ${APPLICATION_STATUS_LABELS[status]}.`}>
      <View style={styles.header}>
        <AppText variant="subheading" style={styles.title}>
          {title}
        </AppText>
        <StatusBadge status={status} />
      </View>
      {job ? (
        <AppText color="textMuted">
          {job.company} · {job.town}
        </AppText>
      ) : null}
      <AppText variant="caption">Applied {formatDate(application.created_at)}</AppText>
      {status === 'interviewing' && application.interview_at ? (
        <AppText variant="caption" color="warning">
          Interview: {formatDateTime(application.interview_at)}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
});
