import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, ScrollView } from 'react-native';

import OnboardingStepFrame from './OnboardingStepFrame';
import { useTheme } from '../../theme/ThemeProvider';
import { OhmTheme } from '../../theme/theme';
import { PreferencesInput, RiskTolerance } from '../../core/userSettings';

interface Props {
  data: PreferencesInput;
  onChange: (data: PreferencesInput) => void;
  onNext: () => void;
  onBack: () => void;
}

// Complete 24-hour options list index
const HOURS_LIST = Array.from({ length: 24 }).map((_, i) => {
  const hour = String(i).padStart(2, '0') + ':00';
  const ampm = i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`;
  return { value: hour, label: ampm };
});

export default function PreferencesStep({ data, onChange, onNext, onBack }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const isLight = theme.mode === 'light';

  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const Chip = ({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) => (
    <Pressable
      style={[styles.chip, active && { backgroundColor: theme.chipActiveBg, borderColor: theme.chipActiveBg }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && { color: theme.chipActiveText }]}>{label}</Text>
    </Pressable>
  );

  // Formats military hour string labels back to user-friendly AM/PM tokens for the selection chips
  const formatTimeToAmPm = (timeStr: string) => {
    const hr = parseInt(timeStr.split(':')[0]) || 0;
    return hr === 0 ? '12 AM' : hr === 12 ? '12 PM' : hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
  };

  return (
    <OnboardingStepFrame
      iconName="preferences-onboarding"
      title="Preferences"
      subtitle="Customize how and when Ohm keeps you notified about upcoming risk windows."
      stepNumber={4}
      totalSteps={5}
      onBack={onBack}
      onNext={onNext}
    >
      {/* Risk Tolerance Selection Section */}
      <Text style={styles.fieldLabel}>risk tolerance</Text>
      <View style={styles.chipRow}>
        {(['cautious', 'balanced', 'minimal'] as RiskTolerance[]).map((rt) => (
          <Chip
            key={rt}
            active={data.riskTolerance === rt}
            label={rt.charAt(0).toUpperCase() + rt.slice(1)}
            onPress={() => onChange({ ...data, riskTolerance: rt })}
          />
        ))}
      </View>
      <Text style={styles.psText}>
        Cautious: alert me even at lower risk. Balanced: alert me at moderate-to-high risk. Minimal: only alert me at very high risk.
      </Text>

      {/* Notifications Switch Section */}
      <Text style={styles.fieldLabel}>notification sounds & vibration</Text>
      <View style={styles.chipRow}>
        <Chip
          active={!data.notificationsOn}
          label="Off"
          onPress={() => onChange({ ...data, notificationsOn: false })}
        />
        <Chip
          active={data.notificationsOn}
          label="On"
          onPress={() => onChange({ ...data, notificationsOn: true })}
        />
      </View>

      {/* Quiet Hours Switch Section */}
      <Text style={styles.fieldLabel}>enable quiet hours</Text>
      <View style={styles.chipRow}>
        <Chip
          active={!data.quietHoursOn}
          label="Off"
          onPress={() => onChange({ ...data, quietHoursOn: false })}
        />
        <Chip
          active={data.quietHoursOn}
          label="On"
          onPress={() => onChange({ ...data, quietHoursOn: true })}
        />
      </View>
      <Text style={styles.psText}>
        If on, elevated risk alerts will be silenced during the selected timeframe. High risk alerts will still come through.
      </Text>

      {/* Dual Handle Selector UX: Displays two distinct picker buttons for Start and End ranges */}
      {data.quietHoursOn && (
        <View style={styles.quietHoursContainer}>
          <Text style={styles.fieldLabel}>quiet hours timeframe</Text>
          <View style={styles.timeframePickerRow}>
            <View style={styles.timePickerBlock}>
              <Text style={styles.timePickerBlockLabel}>from</Text>
              <Pressable style={styles.timeSelectorChipTrigger} onPress={() => setActivePicker('start')}>
                <Text style={styles.timeSelectorValueText}>
                  {formatTimeToAmPm(data.quietHoursStart || '22:00')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.timePickerBlock}>
              <Text style={styles.timePickerBlockLabel}>to</Text>
              <Pressable style={styles.timeSelectorChipTrigger} onPress={() => setActivePicker('end')}>
                <Text style={styles.timeSelectorValueText}>
                  {formatTimeToAmPm(data.quietHoursEnd || '06:00')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Persistent Selection Dropdown Modal Overlay */}
      <Modal visible={activePicker !== null} transparent={true} animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <Pressable style={styles.modalBackdropScrim} onPress={() => setActivePicker(null)}>
          <View style={styles.dropdownOptionsContainerBox}>
            <Text style={styles.dropdownModalHeaderTitle}>
              Select {activePicker === 'start' ? 'Start' : 'End'} Time
            </Text>
            <ScrollView style={styles.optionsListScrollFrame} showsVerticalScrollIndicator={true}>
              {HOURS_LIST.map((hourObj) => (
                <Pressable
                  key={hourObj.value}
                  style={[
                    styles.singleOptionItemRow,
                    ((activePicker === 'start' && data.quietHoursStart === hourObj.value) ||
                     (activePicker === 'end' && data.quietHoursEnd === hourObj.value)) && {
                      backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'
                    }
                  ]}
                  onPress={() => {
                    if (activePicker === 'start') {
                      onChange({ ...data, quietHoursStart: hourObj.value });
                    } else {
                      onChange({ ...data, quietHoursEnd: hourObj.value });
                    }
                    setActivePicker(null);
                  }}
                >
                  <Text style={[styles.optionItemTextLabel, { color: theme.textPrimary }]}>
                    {hourObj.label} ({hourObj.value})
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </OnboardingStepFrame>
  );
}
function makeStyles(theme: OhmTheme) {
  return StyleSheet.create({
    fieldLabel: { fontSize: 13, color: theme.textSecondary, marginTop: 18, marginBottom: 8, fontFamily: 'Gilroy-Bold', fontWeight: '700', textTransform: 'lowercase' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 },
    chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.chipBorder, backgroundColor: theme.chipInactiveBg, marginRight: 8, marginBottom: 8 },
    chipText: { fontSize: 13, color: theme.chipInactiveText, fontFamily: 'Gilroy-SemiBold', fontWeight: '600' },
    psText: { fontSize: 11, color: theme.textMuted, lineHeight: 16, marginTop: 2, marginBottom: 12, fontFamily: 'Gilroy-Regular' },
    
    quietHoursContainer: { width: '100%', marginTop: 4 },
    
    // Balanced horizontal dual input layout framework
    timeframePickerRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 4 },
    timePickerBlock: { flex: 1, marginRight: 12 },
    timePickerBlockLabel: { fontSize: 11, color: theme.textMuted, marginBottom: 6, fontFamily: 'Gilroy-Medium', textTransform: 'lowercase' },
    
    timeSelectorChipTrigger: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    timeSelectorValueText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, fontFamily: 'Gilroy-Bold' },

    modalBackdropScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    dropdownOptionsContainerBox: { width: '100%', maxWidth: 320, maxHeight: 380, backgroundColor: theme.cardBackground || '#FFFFFF', borderRadius: 20, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
    dropdownModalHeaderTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Gilroy-Bold', color: theme.textPrimary, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    optionsListScrollFrame: { flex: 1, paddingHorizontal: 8, marginTop: 4 },
    singleOptionItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 2 },
    optionItemTextLabel: { fontSize: 14, fontFamily: 'Gilroy-Medium', fontWeight: '500' },
  });
}
