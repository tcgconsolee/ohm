import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

import { useOhmPipeline } from '../hooks/useOhmPipeline';
import { revisitSetupRef } from '../navigation/appRefs';
import { FeederType } from '../core/infrastructureFactor';
import { RiskTolerance, SUPPORTED_DISTRICTS } from '../core/userSettings';
import { useTheme, useThemePreference, ThemePreference } from '../theme/ThemeProvider';
import { OhmTheme } from '../theme/theme';
import OhmLogo from '../components/OhmLogo';
import Icon from '../components/Icon';
import AnimatedCheckbox from '../components/AnimatedCheckbox'; // Core radial checkbox import pass
import AsyncStorage from '@react-native-async-storage/async-storage'; // Needed to wipe onboarding state

const HOURS_LIST = Array.from({ length: 24 }).map((_, i) => {
  const hour = String(i).padStart(2, '0') + ':00';
  const ampm = i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`;
  return { value: hour, label: ampm };
});

const DISTRICTS_LIST = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 
  'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram', 'Karur', 'Krishnagiri', 
  'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 
  'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 
  'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
];

export default function SettingsScreen() {
  const { state, settings, updateSettings } = useOhmPipeline();
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const navigation = useNavigation<any>();
  const styles = makeStyles(theme);
  const isLight = theme.mode === 'light';

  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [activeTimePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const Chip = ({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) => (
    <Pressable
      style={[styles.chip, active && { backgroundColor: theme.chipActiveBg, borderColor: theme.chipActiveBg }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && { color: theme.chipActiveText }]}>{label}</Text>
    </Pressable>
  );

  const formatTimeToAmPm = (timeStr: string) => {
    const hr = parseInt(timeStr.split(':')[0]) || 0;
    return hr === 0 ? '12 AM' : hr === 12 ? '12 PM' : hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
  };

  // Returns to onboarding without clearing any saved settings/history -
  // just changes which phase App.tsx's RootNavigator renders.
  const handleRevisitSetup = () => {
    try {
      if (revisitSetupRef.current) {
        revisitSetupRef.current();
      } else {
        console.warn('SettingsScreen: revisitSetupRef not set - RootNavigator may not be mounted');
      }
    } catch (err) {
      console.warn('SettingsScreen: Failed to safely trigger onboarding stack jump', err);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      {/* Page Header Navigation Row Layer */}
      <View style={styles.headerRow}>
        <View style={[styles.boltBox, { borderColor: theme.border }]}>
          <OhmLogo size={12} />
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerMainTitle}>Settings &</Text>
          <Text style={styles.headerMainTitle}>Preferences</Text>
        </View>
        <View style={[styles.settingsIconBox, { backgroundColor: theme.buttonPrimaryBg }]}>
          <Icon name="exit" size={15} color={theme.buttonPrimaryText} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Alerts</Text>
      
      <Text style={styles.fieldLabel}>risk tolerance</Text>
      <View style={styles.chipRow}>
        {(['cautious', 'balanced', 'minimal'] as RiskTolerance[]).map((rt) => (
          <Chip
            key={rt}
            active={settings.preferences.riskTolerance === rt}
            label={rt.charAt(0).toUpperCase() + rt.slice(1)}
            onPress={() => updateSettings({ ...settings, preferences: { ...settings.preferences, riskTolerance: rt } })}
          />
        ))}
      </View>
      <Text style={styles.psText}>
        Cautious: alert me even at lower risk. Balanced: alert me at moderate-to-high risk. Minimal:
        only alert me at very high risk.
      </Text>

      <Text style={styles.fieldLabel}>notification sounds & vibration</Text>
      <View style={styles.chipRow}>
        <Chip
          active={!settings.preferences.notificationsOn}
          label="Off"
          onPress={() => updateSettings({ ...settings, preferences: { ...settings.preferences, notificationsOn: false } })}
        />
        <Chip
          active={settings.preferences.notificationsOn}
          label="On"
          onPress={() => updateSettings({ ...settings, preferences: { ...settings.preferences, notificationsOn: true } })}
        />
      </View>

      <Text style={styles.fieldLabel}>enable quiet hours</Text>
      <View style={styles.chipRow}>
        <Chip
          active={!settings.preferences.quietHoursOn}
          label="Off"
          onPress={() => updateSettings({ ...settings, preferences: { ...settings.preferences, quietHoursOn: false } })}
        />
        <Chip
          active={settings.preferences.quietHoursOn}
          label="On"
          onPress={() => updateSettings({ ...settings, preferences: { ...settings.preferences, quietHoursOn: true } })}
        />
      </View>
      <Text style={styles.psText}>
        If on, elevated risk alerts will be silenced during the selected timeframe. High risk alerts
        will still come through.
      </Text>

      {/* Dual Time Chip Track Range Selectors */}
      {settings.preferences.quietHoursOn && (
        <View style={styles.quietHoursContainer}>
          <Text style={styles.fieldLabel}>quiet hours timeframe</Text>
          <View style={styles.timeframePickerRow}>
            <View style={styles.timePickerBlock}>
              <Text style={styles.timePickerBlockLabel}>from</Text>
              <Pressable style={styles.timeSelectorChipTrigger} onPress={() => setActivePicker('start')}>
                <Text style={styles.timeSelectorValueText}>
                  {formatTimeToAmPm(settings.preferences.quietHoursStart || '22:00')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.timePickerBlock}>
              <Text style={styles.timePickerBlockLabel}>to</Text>
              <Pressable style={styles.timeSelectorChipTrigger} onPress={() => setActivePicker('end')}>
                <Text style={styles.timeSelectorValueText}>
                  {formatTimeToAmPm(settings.preferences.quietHoursEnd || '06:00')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      <Text style={styles.sectionTitle}>Your info</Text>

      {/* Dropdown Selector trigger for District/City selection matrix */}
      <Text style={styles.fieldLabel}>district/city</Text>
      <Pressable style={styles.dropdownSelectorTrigger} onPress={() => setDistrictDropdownOpen(true)}>
        <Text style={[styles.selectorValueText, !settings.location.district && { color: theme.textMuted }]}>
          {settings.location.district || 'Select your district/city'}
        </Text>
      </Pressable>

      <Text style={styles.fieldLabel}>area/locality</Text>
      <TextInput
        style={styles.textInput}
        value={settings.location.area}
        onChangeText={(v) => updateSettings({ ...settings, location: { ...settings.location, area: v } })}
        placeholder="e.g. Peelamedu"
        placeholderTextColor={theme.textMuted}
      />

      <Text style={styles.fieldLabel}>pincode (optional)</Text>
      <TextInput
        style={styles.textInput}
        keyboardType="numeric"
        value={settings.location.pincode}
        onChangeText={(v) => updateSettings({ ...settings, location: { ...settings.location, pincode: v } })}
        placeholder="e.g. 641004"
        placeholderTextColor={theme.textMuted}
      />

      {/* Interactive reactive text confirmation row tag */}
      <Text style={styles.selectedNote}>
        SELECTED:{' '}
        <Text style={styles.selectedNoteBold}>
          {settings.location.district.trim() ? settings.location.district : '[District]'}
        </Text>
        {settings.location.area.trim() ? `, ${settings.location.area}` : ''} - TANGEDCO Circle:{' '}
        <Text style={styles.selectedNoteBold}>
          {settings.location.district.trim() ? `[${settings.location.district.slice(0, 3).toUpperCase()}]` : '[X]'}
        </Text>
      </Text>

      <Text style={styles.fieldLabel}>business type/industry</Text>
      <TextInput
        style={styles.textInput}
        value={settings.businessType}
        onChangeText={(v) => updateSettings({ ...settings, businessType: v })}
        placeholder="Power loom, textile mill, ..."
        placeholderTextColor={theme.textMuted}
      />

      <Text style={styles.fieldLabel}>feeder type</Text>
      <View style={styles.chipRow}>
        {(['industrial', 'mixed', 'not_sure'] as FeederType[]).map((ft) => (
          <Chip
            key={ft}
            active={settings.infrastructure.feederType === ft}
            label={ft === 'not_sure' ? 'Not sure' : ft.charAt(0).toUpperCase() + ft.slice(1)}
            onPress={() => updateSettings({ ...settings, infrastructure: { ...settings.infrastructure, feederType: ft } })}
          />
        ))}
      </View>

      {/* REFACTORED: Building Connection Age Slider with AnimatedCheckbox Integration */}
      <Text style={styles.fieldLabel}>approximate connection/building age</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={50}
        step={1}
        disabled={settings.infrastructure.buildingAgeYears === null}
        value={settings.infrastructure.buildingAgeYears ?? 10}
        onSlidingComplete={(v) => updateSettings({ ...settings, infrastructure: { ...settings.infrastructure, buildingAgeYears: v } })}
        minimumTrackTintColor={theme.textPrimary}
        maximumTrackTintColor={isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'}
        thumbTintColor={theme.textPrimary}
      />
      <Text style={styles.sliderValueLabel}>
        {settings.infrastructure.buildingAgeYears !== null ? `~${settings.infrastructure.buildingAgeYears} years` : '--'}
      </Text>
      <Pressable
        style={styles.checkboxWrapperRow}
        onPress={() => updateSettings({ ...settings, infrastructure: { ...settings.infrastructure, buildingAgeYears: settings.infrastructure.buildingAgeYears === null ? 10 : null } })}
      >
        <AnimatedCheckbox 
          checked={settings.infrastructure.buildingAgeYears === null} 
          onPress={() => updateSettings({ ...settings, infrastructure: { ...settings.infrastructure, buildingAgeYears: settings.infrastructure.buildingAgeYears === null ? 10 : null } })}
          size={16}
        />
        <Text style={styles.checkboxTextLabel}>I'm not sure</Text>
      </Pressable>

      {/* REFACTORED: Prior Outage Frequency Slider with AnimatedCheckbox Integration */}
      <Text style={styles.fieldLabel}>prior outage frequency</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={20}
        step={1}
        disabled={settings.infrastructure.priorOutageFrequencyPerMonth === null}
        value={settings.infrastructure.priorOutageFrequencyPerMonth ?? 5}
        onSlidingComplete={(v) => updateSettings({ ...settings, infrastructure: { ...settings.infrastructure, priorOutageFrequencyPerMonth: v } })}
        minimumTrackTintColor={theme.textPrimary}
        maximumTrackTintColor={isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'}
        thumbTintColor={theme.textPrimary}
      />
      <Text style={styles.sliderValueLabel}>
        {settings.infrastructure.priorOutageFrequencyPerMonth !== null ? `~${settings.infrastructure.priorOutageFrequencyPerMonth} per month` : '--'}
      </Text>
      <Pressable
        style={styles.checkboxWrapperRow}
        onPress={() => updateSettings({ ...settings, infrastructure: { ...settings.infrastructure, priorOutageFrequencyPerMonth: settings.infrastructure.priorOutageFrequencyPerMonth === null ? 5 : null } })}
      >
        <AnimatedCheckbox 
          checked={settings.infrastructure.priorOutageFrequencyPerMonth === null} 
          onPress={() => updateSettings({ ...settings, infrastructure: { ...settings.infrastructure, priorOutageFrequencyPerMonth: settings.infrastructure.priorOutageFrequencyPerMonth === null ? 5 : null } })}
          size={16}
        />
        <Text style={styles.checkboxTextLabel}>I'm not sure</Text>
      </Pressable>

      <Text style={styles.fieldLabel}>existing backup generator</Text>
      <View style={styles.chipRow}>
        {(['none', 'diesel', 'other'] as const).map((bg) => (
          <Chip
            key={bg}
            active={settings.infrastructure.backupGenerator === bg}
            label={bg.charAt(0).toUpperCase() + bg.slice(1)}
            onPress={() => updateSettings({ ...settings, infrastructure: { ...settings.infrastructure, backupGenerator: bg } })}
          />
        ))}
      </View>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <Text style={styles.fieldLabel}>theme</Text>
      <View style={styles.chipRow}>
        {(['light', 'dark', 'system'] as ThemePreference[]).map((mode) => (
          <Chip
            key={mode}
            active={preference === mode}
            label={mode.charAt(0).toUpperCase() + mode.slice(1)}
            onPress={() => setPreference(mode)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>About</Text>
      
      {/* REFACTORED SYSTEM ENTRY ACTION POINT TARGET LINK LINK */}
      <Pressable style={styles.aboutButton} onPress={handleRevisitSetup}>
        <Text style={styles.aboutButtonText}>Revisit the setup explainer</Text>
      </Pressable>
      
      <Pressable style={styles.aboutButton} onPress={() => navigation.navigate('Disclosure')}>
        <Text style={styles.aboutButtonText}>How we use your information</Text>
      </Pressable>

      <Text style={styles.appVersion}>App version: 0.1.0</Text>

      {/* REGIONAL LOOKUP INTERACTIVE MODAL OVERLAY */}
      <Modal visible={districtDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => setDistrictDropdownOpen(false)}>
        <Pressable style={styles.modalBackdropScrim} onPress={() => setDistrictDropdownOpen(false)}>
          <View style={styles.dropdownOptionsContainerBox}>
            <Text style={styles.dropdownModalHeaderTitle}>Select District</Text>
            <ScrollView style={styles.optionsListScrollFrame} showsVerticalScrollIndicator={true}>
              {DISTRICTS_LIST.map((districtName) => (
                <Pressable
                  key={districtName}
                  style={[
                    styles.singleOptionItemRow,
                    settings.location.district === districtName && { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }
                  ]}
                  onPress={() => {
                    updateSettings({ ...settings, location: { ...settings.location, district: districtName } });
                    setDistrictDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.optionItemTextLabel, { color: theme.textPrimary }]}>{districtName}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* QUIET HOURS PICKER INTERACTIVE MODAL OVERLAY */}
      <Modal visible={activeTimePicker !== null} transparent={true} animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <Pressable style={styles.modalBackdropScrim} onPress={() => setActivePicker(null)}>
          <View style={styles.dropdownOptionsContainerBox}>
            <Text style={styles.dropdownModalHeaderTitle}>
              Select {activeTimePicker === 'start' ? 'Start' : 'End'} Time
            </Text>
            <ScrollView style={styles.optionsListScrollFrame} showsVerticalScrollIndicator={true}>
              {HOURS_LIST.map((hourObj) => (
                <Pressable
                  key={hourObj.value}
                  style={[
                    styles.singleOptionItemRow,
                    ((activeTimePicker === 'start' && settings.preferences.quietHoursStart === hourObj.value) ||
                     (activeTimePicker === 'end' && settings.preferences.quietHoursEnd === hourObj.value)) && {
                      backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'
                    }
                  ]}
                  onPress={() => {
                    if (activeTimePicker === 'start') {
                      updateSettings({ ...settings, preferences: { ...settings.preferences, quietHoursStart: hourObj.value } });
                    } else {
                      updateSettings({ ...settings, preferences: { ...settings.preferences, quietHoursEnd: hourObj.value } });
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
    </ScrollView>
  );
}

function makeStyles(theme: OhmTheme) {
  const isLight = theme.mode === 'light';

  return StyleSheet.create({
    content: { padding: 20, paddingTop: 60, paddingBottom: 180, flexGrow: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 },
    boltBox: { width: 36, height: 36, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    settingsIconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerMainTitle: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', fontFamily: 'Gilroy-Bold', lineHeight: 16 },
    sectionTitle: { fontWeight: '900', fontSize: 16, marginTop: 28, marginBottom: 12, color: theme.textPrimary, fontFamily: 'Gilroy-Black' },
    fieldLabel: { fontSize: 13, color: theme.textSecondary, marginTop: 14, marginBottom: 8, fontFamily: 'Gilroy-Bold', fontWeight: '700', textTransform: 'lowercase' },
    psText: { fontSize: 11, color: theme.textMuted, lineHeight: 16, marginTop: 4, marginBottom: 12, fontFamily: 'Gilroy-Regular' },
    selectedNote: { fontSize: 11, color: theme.textMuted, lineHeight: 16, marginTop: 14, marginBottom: 12, fontFamily: 'Gilroy-Regular' },
    selectedNoteBold: { fontFamily: 'Gilroy-Bold', fontWeight: '700', color: theme.textPrimary },
    dropdownSelectorTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBackground, borderRadius: 12, padding: 12, width: '100%' },
    selectorValueText: { fontSize: 14, color: theme.textPrimary, fontFamily: 'Gilroy-Regular' },
    quietHoursContainer: { width: '100%', marginTop: 4 },
    timeframePickerRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 4 },
    timePickerBlock: { flex: 1, marginRight: 12 },
    timePickerBlockLabel: { fontSize: 11, color: theme.textMuted, marginBottom: 6, fontFamily: 'Gilroy-Medium', textTransform: 'lowercase' },
    timeSelectorChipTrigger: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBackground, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', width: '100%' },
    timeSelectorValueText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, fontFamily: 'Gilroy-Bold' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
    chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.chipBorder, backgroundColor: theme.chipInactiveBg, marginRight: 8, marginBottom: 8 },
    chipText: { fontSize: 13, color: theme.chipInactiveText, fontFamily: 'Gilroy-SemiBold', fontWeight: '600' },
    textInput: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.textPrimary, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Gilroy-Regular', width: '100%' },
    slider: { width: '100%', height: 36, marginTop: 4 },
    sliderValueLabel: { fontSize: 11, color: theme.textMuted, textAlign: 'right', marginTop: -2, fontFamily: 'Gilroy-Medium' },
    checkboxWrapperRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 14, alignSelf: 'flex-start' },
    checkboxTextLabel: { fontSize: 13, color: theme.textSecondary, marginLeft: 8, fontFamily: 'Gilroy-Medium', fontWeight: '500' },
    aboutButton: { backgroundColor: theme.buttonPrimaryBg, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
    aboutButtonText: { color: theme.buttonPrimaryText, fontWeight: '700', fontSize: 13, fontFamily: 'Gilroy-Bold' },
    appVersion: { marginTop: 24, color: theme.textMuted, fontSize: 11, textAlign: 'center', fontFamily: 'Gilroy-Regular' },
    modalBackdropScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    dropdownOptionsContainerBox: { width: '100%', maxWidth: 320, maxHeight: 380, backgroundColor: theme.cardBackground || '#FFFFFF', borderRadius: 20, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
    dropdownModalHeaderTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Gilroy-Bold', color: theme.textPrimary, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    optionsListScrollFrame: { flex: 1, paddingHorizontal: 8, marginTop: 4 },
    singleOptionItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 2 },
    optionItemTextLabel: { fontSize: 14, fontFamily: 'Gilroy-Medium', fontWeight: '500' },
  });
}
