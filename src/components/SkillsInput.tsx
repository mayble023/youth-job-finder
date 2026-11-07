import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';
import { SKILLS_MAX, SKILL_MAX_LENGTH, skillSchema } from '@/utils/validators/profile';

import { AppText } from './AppText';
import { Button } from './Button';
import { Chip } from './Chip';
import { TextField } from './TextField';

export type SkillsInputProps = {
  value: string[];
  onChange: (skills: string[]) => void;
  /** Error for the whole list, from the form schema. */
  error?: string | null;
  disabled?: boolean;
};

/** Type a skill and tap Add; tap a skill chip to remove it. */
export function SkillsInput({ value, onChange, error, disabled = false }: SkillsInputProps) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const isFull = value.length >= SKILLS_MAX;

  const addSkill = () => {
    const parsed = skillSchema.safeParse(draft);
    if (!parsed.success) {
      setDraftError(parsed.error.issues[0]?.message ?? 'Enter a skill.');
      return;
    }
    if (value.includes(parsed.data)) {
      setDraftError(`You already added "${parsed.data}".`);
      return;
    }
    if (isFull) {
      setDraftError(`You can add up to ${SKILLS_MAX} skills.`);
      return;
    }
    onChange([...value, parsed.data]);
    setDraft('');
    setDraftError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.input}>
          <TextField
            label={`Skills (${value.length}/${SKILLS_MAX})`}
            placeholder="e.g. excel, driving, customer service"
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              if (draftError) setDraftError(null);
            }}
            onSubmitEditing={addSkill}
            returnKeyType="done"
            autoCapitalize="none"
            maxLength={SKILL_MAX_LENGTH}
            error={draftError ?? error}
            hint="Skills help us recommend jobs that match you."
            editable={!disabled && !isFull}
            submitBehavior="submit"
          />
        </View>
        <Button
          title="Add"
          icon="add"
          onPress={addSkill}
          disabled={disabled || isFull || draft.trim() === ''}
          fullWidth={false}
          style={styles.addButton}
        />
      </View>

      {value.length > 0 ? (
        <View style={styles.chips}>
          {value.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              icon="close"
              disabled={disabled}
              onPress={() => onChange(value.filter((item) => item !== skill))}
            />
          ))}
        </View>
      ) : (
        <AppText variant="caption">No skills added yet.</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
  },
  addButton: {
    marginTop: spacing.xl,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
