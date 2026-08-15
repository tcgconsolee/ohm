import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import OnboardingStepFrame from './OnboardingStepFrame';
import { useTheme } from '../../theme/ThemeProvider';
import { OhmTheme } from '../../theme/theme';
import { SUPPORTED_DISTRICTS } from '../../core/userSettings'; // Locks directly into backend supported sets

interface LocationInput {
  district: string;
  area: string;
  pincode: string;
}

interface Props {
  data: LocationInput;
  onChange: (data: LocationInput) => void;
  onNext: () => void;
}

export default function LocationStep({ data, onChange, onNext }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Verification step check: ensures area copy is entered and the current selection is supported [6]
  const isNextDisabled = !data.district.trim() || !data.area.trim();

  return (
    <OnboardingStepFrame
      iconName="location-onboarding"
      title="Location"
      subtitle="This helps us match you to outage data and alerts specific to your area."
      stepNumber={2}
      totalSteps={5}
      onNext={onNext}
      nextDisabled={isNextDisabled}
    >
      {/* District Dropdown Selector Trigger */}
      <Text style={styles.fieldLabel}>district/city</Text>
      <Pressable style={styles.dropdownSelectorTrigger} onPress={() => setDropdownOpen(true)}>
        <Text style={[styles.selectorValueText, !data.district && { color: theme.textMuted }]}>
          {data.district || 'Select your district/city'}
        </Text>
      </Pressable>

      {/* Area Text Input Block */}
      <Text style={styles.fieldLabel}>area/locality</Text>
      <TextInput
        style={styles.textInput}
        value={data.area}
        onChangeText={(v) => onChange({ ...data, area: v })}
        placeholder="e.g. Peelamedu"
        placeholderTextColor={theme.textMuted}
      />

      {/* Pincode Text Input Block */}
      <Text style={styles.fieldLabel}>pincode (optional)</Text>
      <TextInput
        style={styles.textInput}
        keyboardType="numeric"
        value={data.pincode}
        onChangeText={(v) => onChange({ ...data, pincode: v })}
        placeholder="e.g. 641004"
        placeholderTextColor={theme.textMuted}
      />

      {/* Dynamic Metadata Confirmation Label Output */}
      <Text style={styles.selectedNote}>
        SELECTED:{' '}
        <Text style={styles.selectedNoteBold}>
          {data.district.trim() ? data.district : '[District]'}
        </Text>
        {data.area.trim() ? `, ${data.area}` : ''} - TANGEDCO Circle:{' '}
        <Text style={styles.selectedNoteBold}>
          {data.district.trim() ? `[${data.district.slice(0, 3).toUpperCase()}]` : '[X]'}
        </Text>
      </Text>

      {/* Dropdown Options Overlay Modal Layer */}
      <Modal visible={dropdownOpen} transparent={true} animationType="fade" onRequestClose={() => setDropdownOpen(false)}>
        <Pressable style={styles.modalBackdropScrim} onPress={() => setDropdownOpen(false)}>
          <View style={styles.dropdownOptionsContainerBox}>
            <Text style={styles.dropdownModalHeaderTitle}>Select District</Text>
            <ScrollView style={styles.optionsListScrollFrame} showsVerticalScrollIndicator={true}>
              {SUPPORTED_DISTRICTS.map((districtObj) => (
                <Pressable
                  key={districtObj.name}
                  style={[
                    styles.singleOptionItemRow,
                    data.district === districtObj.name && { backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }
                  ]}
                  onPress={() => {
                    onChange({ ...data, district: districtObj.name });
                    setDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.optionItemTextLabel, { color: theme.textPrimary }]}>{districtObj.name}</Text>
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
    fieldLabel: { fontSize: 13, color: theme.textSecondary, marginTop: 16, marginBottom: 8, fontFamily: 'Gilroy-Bold', fontWeight: '700', textTransform: 'lowercase' },
    
    dropdownSelectorTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      padding: 12,
      width: '100%',
    },
    selectorValueText: { fontSize: 14, color: theme.textPrimary, fontFamily: 'Gilroy-Regular' },
    textInput: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.textPrimary, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Gilroy-Regular', width: '100%' },
    
    selectedNote: { fontSize: 11, color: theme.textMuted, lineHeight: 16, marginTop: 14, marginBottom: 12, fontFamily: 'Gilroy-Regular' },
    selectedNoteBold: { fontFamily: 'Gilroy-Bold', fontWeight: '700', color: theme.textPrimary },

    modalBackdropScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    dropdownOptionsContainerBox: { width: '100%', maxWidth: 320, maxHeight: 180, backgroundColor: theme.cardBackground || '#FFFFFF', borderRadius: 20, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
    dropdownModalHeaderTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Gilroy-Bold', color: theme.textPrimary, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    optionsListScrollFrame: { flex: 1, paddingHorizontal: 8, marginTop: 4 },
    singleOptionItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 2 },
    optionItemTextLabel: { fontSize: 14, fontFamily: 'Gilroy-Medium', fontWeight: '500' },
  });
}
