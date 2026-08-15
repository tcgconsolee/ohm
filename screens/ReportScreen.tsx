import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeProvider';
import { OhmTheme } from '../theme/theme';
import OhmLogo from '../components/OhmLogo';
import Icon from '../components/Icon';
import { confirmationLog } from '../hooks/useOhmPipeline';

export default function ReportScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const isLight = theme.mode === 'light';

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  // Multi-Tone Background Configuration Blocks
  const upperBgColor = isLight ? '#A2A3AA' : '#2C2C2D';
  const lowerBgColor = isLight ? '#BCBDC1' : '#383839';
  const dividerColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.7)';

  const handleSubmit = async () => {
    setStatus(null);
    if (!date || !startTime || !endTime) {
      setStatus('Please fill in date, start time, and end time.');
      return;
    }
    try {
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(`${date}T${endTime}:00`);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setStatus('Could not read that date/time - use YYYY-MM-DD and HH:MM.');
        return;
      }
      const result = await confirmationLog.reportOutage(start, end);
      setStatus(
        result.matchedExistingWindow
          ? 'Matched an existing alert - marked as confirmed.'
          : 'Logged as an outage we missed. Thanks for letting us know.'
      );
      setTimeout(() => navigation.goBack(), 1200);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  };

  const dynamicStyles = {
    textInput: [
      styles.textInput,
      {
        borderColor: theme.border,
        backgroundColor: theme.inputBackground,
        color: theme.textPrimary,
      },
    ],
    fieldLabel: [styles.fieldLabel, { color: theme.textSecondary }],
    timeSeparator: [styles.timeSeparator, { color: theme.textSecondary }]
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand Vector Logo Badge */}
      <OhmLogo size={18} style={styles.logo} />

      {/* Styled Header Card Area splitting background tones */}
      <View style={styles.headerCard}>
        {/* Upper Segment Area with Vector Icon Embedded */}
        <View style={[styles.cardUpperBlock, { backgroundColor: upperBgColor }]}>
          <View style={styles.iconWrapper}>
            <Icon name="report" size={14} color={theme.textPrimary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Report
          </Text>
        </View>

        {/* 70% Opacity White Divider Axis Line */}
        <View style={[styles.dividerWrapperContainer, { backgroundColor: lowerBgColor }]}>
          <View style={[styles.card70PercentDivider, { backgroundColor: dividerColor }]} />
        </View>

        {/* Lower Segment Area (Lighter Background) */}
        <View style={[styles.cardLowerBlock, { backgroundColor: lowerBgColor }]}>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Let us know about an outage we didn't warn you about. This helps us catch what we missed.
          </Text>
        </View>
      </View>

      {/* Form Input Context Elements Layout View Block */}
      <View style={styles.formContainer}>
        <Text style={dynamicStyles.fieldLabel}>date</Text>
        <TextInput 
          style={dynamicStyles.textInput} 
          placeholder="2026-08-08" 
          placeholderTextColor={theme.textMuted}
          value={date} 
          onChangeText={setDate} 
        />

        <Text style={dynamicStyles.fieldLabel}>approximate timeframe</Text>
        <View style={styles.timeRow}>
          <TextInput
            style={[dynamicStyles.textInput, styles.timeInput]}
            placeholder="10:00"
            placeholderTextColor={theme.textMuted}
            value={startTime}
            onChangeText={setStartTime}
          />
          <Text style={dynamicStyles.timeSeparator}>to</Text>
          <TextInput
            style={[dynamicStyles.textInput, styles.timeInput]}
            placeholder="16:00"
            placeholderTextColor={theme.textMuted}
            value={endTime}
            onChangeText={setEndTime}
          />
        </View>
      </View>

      {/* Action Submit Button Target Layout Area */}
      <Pressable style={[styles.submitButton, { backgroundColor: theme.buttonPrimaryBg }]} onPress={handleSubmit}>
        <Text style={[styles.submitButtonText, { color: theme.buttonPrimaryText }]}>Submit</Text>
      </Pressable>

      {status && <Text style={[styles.status, { color: theme.textPrimary }]}>{status}</Text>}

      <Text style={[styles.footer, { color: theme.textSecondary }]}>
        This helps us improve, especially the outages we don't catch.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 30, paddingBottom: 40, alignItems: 'center', flexGrow: 1 },
  
  logo: { alignSelf: 'center', marginBottom: 20 },
  
  // Split Multi-Tone Card Layout Architecture System
  headerCard: { borderRadius: 24, padding: 0, marginBottom: 24, width: '100%', overflow: 'hidden' },
  cardUpperBlock: { width: '100%', paddingTop: 20, paddingBottom: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  iconWrapper: { marginRight: 6, justifyContent: 'center', alignItems: 'center' },
  
  dividerWrapperContainer: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  card70PercentDivider: { width: '70%', height: 1 },
  
  cardLowerBlock: { width: '100%', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, alignItems: 'center' },
  
  headerTitle: { fontSize: 16, textAlign: 'center', fontFamily: 'Gilroy-Black', fontWeight: '900',},
  headerSubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, fontFamily: 'Gilroy-Regular' },
  
  formContainer: { width: '100%', marginBottom: 12 },
  
  // High-fidelity form styles cloned directly from InfrastructureStep/LocationStep
  fieldLabel: { fontSize: 13, marginTop: 18, marginBottom: 8, fontFamily: 'Gilroy-Bold', fontWeight: '700', textTransform: 'lowercase' },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Gilroy-Regular', width: '100%' },
  
  timeRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  timeInput: { flex: 1 },
  timeSeparator: { fontSize: 13, marginHorizontal: 12, fontFamily: 'Gilroy-Bold', fontWeight: '700', textTransform: 'lowercase' },
  
  submitButton: { 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    width: '100%', 
    justifyContent: 'center',
    marginTop: 28, 
    marginBottom: 24 
  },
  submitButtonText: { fontWeight: '700', fontSize: 13, fontFamily: 'Gilroy-Bold' },
  status: { fontFamily: 'Gilroy-Medium', marginTop: 12, textAlign: 'center', fontSize: 13, lineHeight: 18 },
  footer: { textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 10, marginBottom: 10, fontFamily: 'Gilroy-Regular' },
});
