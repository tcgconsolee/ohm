import React from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';

import OnboardingStepFrame from './OnboardingStepFrame';
import AnimatedCheckbox from '../../components/AnimatedCheckbox';
import { useTheme } from '../../theme/ThemeProvider';
import { OhmTheme } from '../../theme/theme';
import { InfrastructureInput, FeederType, BackupGenerator } from '../../core/infrastructureFactor';

interface Props {
  data: InfrastructureInput;
  onChange: (data: InfrastructureInput) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function InfrastructureStep({ data, onChange, onNext, onBack }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const isLight = theme.mode === 'light';

  const Chip = ({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) => (
    <Pressable
      style={[styles.chip, active && { backgroundColor: theme.chipActiveBg, borderColor: theme.chipActiveBg }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && { color: theme.chipActiveText }]}>{label}</Text>
    </Pressable>
  );

  return (
    <OnboardingStepFrame
      iconName="infrastructure-onboarding"
      title="Infrastructure"
      subtitle="This helps us fine-tune your risk score based on your specific setup."
      stepNumber={3}
      totalSteps={5}
      onBack={onBack}
      onNext={onNext}
    >
      {/* Business Type / Industry Input Section */}
      <Text style={styles.fieldLabel}>business type/industry</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Power loom, textile mill, ..."
        placeholderTextColor={theme.textMuted}
      />

      {/* Feeder Type Select Section */}
      <Text style={styles.fieldLabel}>feeder type</Text>
      <View style={styles.chipRow}>
        {(['industrial', 'mixed', 'not_sure'] as FeederType[]).map((ft) => (
          <Chip
            key={ft}
            active={data.feederType === ft}
            label={ft === 'not_sure' ? 'Not sure' : ft.charAt(0).toUpperCase() + ft.slice(1)}
            onPress={() => onChange({ ...data, feederType: ft })}
          />
        ))}
      </View>

      {/* Building Connection Age Slider Section */}
      <Text style={styles.fieldLabel}>approximate connection/building age</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={50}
        step={1}
        disabled={data.buildingAgeYears === null}
        value={data.buildingAgeYears ?? 10}
        onSlidingComplete={(v) => onChange({ ...data, buildingAgeYears: v })}
        minimumTrackTintColor={theme.textPrimary}
        maximumTrackTintColor={isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'}
        thumbTintColor={theme.textPrimary}
      />
      <Text style={styles.sliderValueLabel}>
        {data.buildingAgeYears !== null ? `~${data.buildingAgeYears} years` : '--'}
      </Text>
      
      {/* Animated Checkbox integration pass for Building Age */}
      <Pressable
        style={styles.checkboxWrapperRow}
        onPress={() => onChange({ ...data, buildingAgeYears: data.buildingAgeYears === null ? 10 : null })}
      >
        <AnimatedCheckbox 
          checked={data.buildingAgeYears === null} 
          onPress={() => onChange({ ...data, buildingAgeYears: data.buildingAgeYears === null ? 10 : null })}
          size={16}
        />
        <Text style={styles.checkboxTextLabel}>I'm not sure</Text>
      </Pressable>

      {/* Prior Outage Slider Section */}
      <Text style={styles.fieldLabel}>prior outage frequency</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={20}
        step={1}
        disabled={data.priorOutageFrequencyPerMonth === null}
        value={data.priorOutageFrequencyPerMonth ?? 5}
        onSlidingComplete={(v) => onChange({ ...data, priorOutageFrequencyPerMonth: v })}
        minimumTrackTintColor={theme.textPrimary}
        maximumTrackTintColor={isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'}
        thumbTintColor={theme.textPrimary}
      />
      <Text style={styles.sliderValueLabel}>
        {data.priorOutageFrequencyPerMonth !== null ? `~${data.priorOutageFrequencyPerMonth} per month` : '--'}
      </Text>
      
      {/* Animated Checkbox integration pass for Outage Frequency */}
      <Pressable
        style={styles.checkboxWrapperRow}
        onPress={() => onChange({ ...data, priorOutageFrequencyPerMonth: data.priorOutageFrequencyPerMonth === null ? 5 : null })}
      >
        <AnimatedCheckbox 
          checked={data.priorOutageFrequencyPerMonth === null} 
          onPress={() => onChange({ ...data, priorOutageFrequencyPerMonth: data.priorOutageFrequencyPerMonth === null ? 5 : null })}
          size={16}
        />
        <Text style={styles.checkboxTextLabel}>I'm not sure</Text>
      </Pressable>

      {/* Backup Generator Options Section */}
      <Text style={styles.fieldLabel}>existing backup generator</Text>
      <View style={styles.chipRow}>
        {(['none', 'diesel', 'other'] as BackupGenerator[]).map((bg) => (
          <Chip
            key={bg}
            active={data.backupGenerator === bg}
            label={bg.charAt(0).toUpperCase() + bg.slice(1)}
            onPress={() => onChange({ ...data, backupGenerator: bg })}
          />
        ))}
      </View>
    </OnboardingStepFrame>
  );
}

function makeStyles(theme: OhmTheme) {
  return StyleSheet.create({
    fieldLabel: { 
      fontSize: 13, 
      color: theme.textSecondary, 
      marginTop: 18, 
      marginBottom: 8, 
      fontFamily: 'Gilroy-Bold', 
      fontWeight: '700', 
      textTransform: 'lowercase' 
    },
    textInput: { 
      borderWidth: 1, 
      borderColor: theme.border, 
      backgroundColor: theme.inputBackground, 
      color: theme.textPrimary, 
      borderRadius: 12, 
      padding: 12, 
      fontSize: 14, 
      fontFamily: 'Gilroy-Regular', 
      width: '100%' 
    },
    chipRow: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      marginBottom: 2 
    },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.chipBorder,
      backgroundColor: theme.chipInactiveBg,
      marginRight: 8,
      marginBottom: 8,
    },
    chipText: { 
      fontSize: 13, 
      color: theme.chipInactiveText, 
      fontFamily: 'Gilroy-SemiBold', 
      fontWeight: '600' 
    },
    slider: { 
      width: '100%', 
      height: 36, 
      marginTop: 2 
    },
    sliderValueLabel: { 
      fontSize: 11, 
      color: theme.textMuted, 
      textAlign: 'right', 
      marginTop: -2, 
      fontFamily: 'Gilroy-Medium' 
    },
    checkboxWrapperRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginTop: 6, 
      marginBottom: 4,
      alignSelf: 'flex-start'
    },
    checkboxTextLabel: { 
      fontSize: 13, 
      color: theme.textSecondary, 
      marginLeft: 8, 
      fontFamily: 'Gilroy-Medium', 
      fontWeight: '500' 
    },
  });
}
