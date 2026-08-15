import { StyleSheet, Text, View, TextInput, Pressable, TextInputProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export function ThemedTextInput(props: TextInputProps & { label?: string }) {
  const theme = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={styles.inputWrap}>
      {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.textPrimary },
          style,
        ]}
        placeholderTextColor={theme.textMuted}
        {...rest}
      />
    </View>
  );
}

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

export function ThemedChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.inputWrap}>
      {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.chipActiveBg : theme.chipInactiveBg,
                  borderColor: theme.chipBorder,
                },
              ]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={[styles.chipText, { color: active ? theme.chipActiveText : theme.chipInactiveText }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: { marginBottom: 14 },
  label: { fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 11, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  chipText: { fontSize: 13 },
});