import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, iconSizes, radii, sizes, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

export type PickerOption<TValue extends string> = { label: string; value: TValue };

export type OptionPickerModalProps<TValue extends string> = {
  visible: boolean;
  title: string;
  options: readonly PickerOption<TValue>[];
  selectedValue: TValue | null;
  onSelect: (value: TValue) => void;
  onClose: () => void;
};

/** A bottom sheet list for picking one option (e.g. a town). Closes after a choice. */
export function OptionPickerModal<TValue extends string>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: OptionPickerModalProps<TValue>) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <AppText variant="subheading" style={styles.title}>
          {title}
        </AppText>
        <FlatList
          data={options}
          keyExtractor={(option) => option.value}
          renderItem={({ item }) => {
            const isSelected = item.value === selectedValue;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <AppText style={styles.optionLabel} color={isSelected ? 'primary' : 'text'}>
                  {item.label}
                </AppText>
                {isSelected ? (
                  <Ionicons name="checkmark" size={iconSizes.md} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={Separator}
        />
        <Button title="Cancel" variant="ghost" onPress={onClose} />
      </SafeAreaView>
    </Modal>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  optionPressed: {
    backgroundColor: colors.primaryLight,
  },
  optionLabel: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
