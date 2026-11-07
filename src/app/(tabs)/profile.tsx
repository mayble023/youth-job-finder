import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  FormAlert,
  LoadingState,
  Screen,
} from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useCvInfo, useDeleteCv, useProfile, useUploadCv, useViewCv } from '@/hooks/useProfile';
import { colors, iconSizes, spacing } from '@/theme';
import type { Profile } from '@/types/database';
import { getErrorKind, getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

export default function ProfileScreen() {
  const {
    data: profile,
    error,
    isPending,
    isError,
    fetchStatus,
    refetch,
    isRefetching,
  } = useProfile();
  const navigateOnce = useNavigateOnce();

  let details: ReactNode;
  if (profile) {
    details = <ProfileDetails profile={profile} />;
  } else if (isError) {
    details = (
      <ErrorState
        title="Could not load your profile"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        retrying={isRefetching}
      />
    );
  } else if (isPending && fetchStatus === 'paused') {
    details = (
      <EmptyState
        icon="cloud-offline-outline"
        title="You're offline"
        message="Your profile will load when you're back online."
        action={{ label: 'Retry', onPress: () => void refetch() }}
      />
    );
  } else {
    details = <LoadingState message="Loading your profile…" />;
  }

  return (
    <Screen scroll edges={['left', 'right']}>
      <View style={styles.stack}>
        {details}

        <Button
          title="Edit profile"
          icon="create-outline"
          disabled={!profile}
          onPress={() => navigateOnce(() => router.push('/profile/edit'))}
        />
        <Button
          title="Saved jobs"
          icon="bookmark-outline"
          variant="secondary"
          onPress={() => navigateOnce(() => router.push('/saved'))}
        />
        <LogOutButton />
      </View>
    </Screen>
  );
}

function ProfileDetails({ profile }: { profile: Profile }) {
  const { user } = useAuth();

  return (
    <>
      <Card>
        <AppText variant="heading">{profile.full_name ?? 'Your profile'}</AppText>
        {user?.email ? <AppText color="textMuted">{user.email}</AppText> : null}
        <Detail icon="location-outline" text={profile.town ?? 'Town not set'} />
        <Detail icon="school-outline" text={profile.education ?? 'Education not set'} />
      </Card>

      <Card>
        <AppText variant="subheading">Skills</AppText>
        {profile.skills.length > 0 ? (
          <View style={styles.chips}>
            {profile.skills.map((skill) => (
              <Chip key={skill} label={skill} />
            ))}
          </View>
        ) : (
          <AppText color="textMuted">
            Add your skills in Edit profile to get better job recommendations.
          </AppText>
        )}
      </Card>

      <CvCard cvPath={profile.cv_path} />
    </>
  );
}

function CvCard({ cvPath }: { cvPath: string | null }) {
  const cvInfo = useCvInfo(cvPath);
  const uploadCv = useUploadCv();
  const viewCv = useViewCv();
  const deleteCv = useDeleteCv();
  const [cvError, setCvError] = useState<unknown>(null);

  const isBusy = uploadCv.isPending || viewCv.isPending || deleteCv.isPending;

  const upload = async () => {
    setCvError(null);
    try {
      await uploadCv.mutateAsync();
    } catch (error) {
      setCvError(error);
    }
  };

  const view = async () => {
    if (!cvPath) return;
    setCvError(null);
    try {
      await viewCv.mutateAsync(cvPath);
    } catch (error) {
      setCvError(error);
    }
  };

  const confirmRemove = () => {
    if (!cvPath) return;
    Alert.alert('Remove your CV?', 'Employers will not see a CV until you upload a new one.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setCvError(null);
          try {
            await deleteCv.mutateAsync(cvPath);
          } catch (error) {
            setCvError(error);
          }
        },
      },
    ]);
  };

  const uploadedAt = cvInfo.data?.uploadedAt;

  return (
    <Card>
      <View style={styles.cvHeader}>
        <Ionicons
          name={cvPath ? 'document-text' : 'document-outline'}
          size={iconSizes.lg}
          color={cvPath ? colors.primary : colors.textMuted}
        />
        <View style={styles.cvText}>
          <AppText variant="subheading">{cvPath ? 'Your CV' : 'No CV uploaded'}</AppText>
          <AppText variant="caption">
            {cvPath
              ? uploadedAt
                ? `PDF · uploaded ${formatDate(uploadedAt)}`
                : 'PDF uploaded'
              : 'Upload a PDF (max 5 MB) so you are ready to apply.'}
          </AppText>
        </View>
      </View>

      <FormAlert message={cvError ? getErrorMessage(cvError) : null} />

      <Button
        title={cvPath ? 'Replace CV' : 'Upload CV'}
        icon="cloud-upload-outline"
        variant={cvPath ? 'ghost' : 'primary'}
        loading={uploadCv.isPending}
        disabled={isBusy}
        onPress={() => void upload()}
      />
      {cvPath ? (
        <View style={styles.cvActions}>
          <Button
            title="View"
            icon="eye-outline"
            variant="secondary"
            fullWidth={false}
            style={styles.cvAction}
            loading={viewCv.isPending}
            disabled={isBusy}
            onPress={() => void view()}
          />
          <Button
            title="Remove"
            icon="trash-outline"
            variant="danger"
            fullWidth={false}
            style={styles.cvAction}
            loading={deleteCv.isPending}
            disabled={isBusy}
            onPress={confirmRemove}
          />
        </View>
      ) : null}
    </Card>
  );
}

function Detail({ icon, text }: { icon: 'location-outline' | 'school-outline'; text: string }) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={iconSizes.md} color={colors.textMuted} />
      <AppText style={styles.detailText}>{text}</AppText>
    </View>
  );
}

function LogOutButton() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<unknown>(null);

  // On success the auth guard sends the user back to the login screen.
  const performSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error);
      setIsSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Log out?', 'You will need your email and password to log back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: performSignOut },
    ]);
  };

  return (
    <>
      <FormAlert
        message={signOutError ? getErrorMessage(signOutError) : null}
        action={
          getErrorKind(signOutError) === 'network'
            ? { label: 'Retry', onPress: performSignOut, loading: isSigningOut }
            : undefined
        }
      />
      <Button
        title="Log out"
        icon="log-out-outline"
        variant="danger"
        onPress={confirmSignOut}
        loading={isSigningOut}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    flex: 1,
  },
  cvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cvText: {
    flex: 1,
    gap: spacing.xs,
  },
  cvActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cvAction: {
    flex: 1,
  },
});
