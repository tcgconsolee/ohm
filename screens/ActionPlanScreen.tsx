import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useActionPlan } from '../hooks/useActionPlan';
import { useTheme } from '../theme/ThemeProvider';
import OhmLogo from '../components/OhmLogo';
import Icon from '../components/Icon';

const COMMON_STEPS = ['Generator', 'Reschedule', 'Alert staff', 'Secure gear'];
const MAX_STEPS = 4;
const MIN_REQUIRED_STEPS = 2;

export default function ActionPlanScreen() {
  const { plan, loaded, save } = useActionPlan();
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const isLight = theme.mode === 'light';
  
  const [steps, setSteps] = useState<string[]>(['', '']);

  useEffect(() => {
    if (loaded) {
      if (plan.length === 0) {
        setSteps(['', '']);
      } else {
        const padded = plan.map((s) => s.text);
        while (padded.length < MIN_REQUIRED_STEPS) padded.push('');
        setSteps(padded);
      }
    }
  }, [loaded, plan]);

  const canAddStep = steps.length < MAX_STEPS;

  const handleAddStep = () => {
    if (canAddStep) setSteps([...steps, '']);
  };

  const handleChangeStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleDeleteStep = (index: number) => {
    const updated = steps.filter((_, idx) => idx !== index);
    while (updated.length < MIN_REQUIRED_STEPS) updated.push('');
    setSteps(updated);
  };

  const handleAddSuggestion = (suggestion: string) => {
    const emptyIndex = steps.findIndex((s) => s.trim() === '');
    if (emptyIndex !== -1) {
      handleChangeStep(emptyIndex, suggestion);
    } else if (steps.length < MAX_STEPS) {
      setSteps([...steps, suggestion]);
    }
  };

  const filledCount = steps.filter((s) => s.trim() !== '').length;
  const canSave = filledCount >= MIN_REQUIRED_STEPS;

  const handleSave = async () => {
    if (!canSave) return;
    await save(steps);
    navigation.goBack();
  };

  const upperBgColor = isLight ? '#A2A3AA' : '#2C2C2D';
  const lowerBgColor = isLight ? '#BCBDC1' : '#383839';
  const dividerColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.7)';

  const dynamicStyles = {
    inputContainer: [styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.inputBackground }],
    textInput: [styles.textInput, { color: theme.textPrimary }],
    deleteButton: [styles.deleteButton, { borderLeftColor: theme.border }],
    fieldLabel: [styles.fieldLabel, { color: theme.textSecondary }],
    suggestionChip: [styles.suggestionChip, { borderColor: theme.chipBorder || theme.border, backgroundColor: theme.chipInactiveBg || 'transparent' }],
    suggestionChipText: [styles.suggestionChipText, { color: theme.chipInactiveText || theme.textPrimary }],
    addStepButton: [styles.addStepButton, { backgroundColor: theme.chipActiveBg || theme.buttonSecondaryBg, borderColor: theme.chipActiveBg || theme.border }],
    addStepButtonText: [styles.addStepButtonText, { color: theme.chipActiveText || theme.textPrimary }],
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <OhmLogo size={18} style={styles.logo} />

      <View style={styles.headerCard}>
        <View style={[styles.cardUpperBlock, { backgroundColor: upperBgColor }]}>
          <View style={styles.iconWrapper}>
            <Icon name="action-plan" size={16} color={theme.textPrimary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Action Plan</Text>
        </View>

        <View style={[styles.dividerWrapperContainer, { backgroundColor: lowerBgColor }]}>
          <View style={[styles.card70PercentDivider, { backgroundColor: dividerColor }]} />
        </View>

        <View style={[styles.cardLowerBlock, { backgroundColor: lowerBgColor }]}>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            List up to 4 steps you'd take during an outage. We'll track them so you can hold yourself accountable.
          </Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        {steps.map((step, index) => {
          const isOptionalStep = index >= MIN_REQUIRED_STEPS;

          return (
            <View key={index} style={styles.stepBlock}>
              <Text style={dynamicStyles.fieldLabel}>step {index + 1}</Text>
              
              <View style={dynamicStyles.inputContainer}>
                <TextInput
                  style={dynamicStyles.textInput}
                  value={step}
                  onChangeText={(text) => handleChangeStep(index, text)}
                  placeholder={!isOptionalStep ? 'required' : 'optional'}
                  placeholderTextColor={theme.textMuted}
                />
                
                {isOptionalStep && (
                  <Pressable style={dynamicStyles.deleteButton} onPress={() => handleDeleteStep(index)}>
                    <Icon 
                      name="delete-icon" 
                      size={16} 
                      color={theme.textPrimary} 
                      fill="currentColor"
                      stroke="currentColor"
                    />
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        <Text style={dynamicStyles.fieldLabel}>suggestions</Text>
        <View style={styles.suggestionChips}>
          {COMMON_STEPS.map((s) => (
            <Pressable key={s} style={dynamicStyles.suggestionChip} onPress={() => handleAddSuggestion(s)}>
              <Text style={dynamicStyles.suggestionChipText}>+ {s.toLowerCase()}</Text>
            </Pressable>
          ))}
        </View>

        {canAddStep && (
          <Pressable style={dynamicStyles.addStepButton} onPress={handleAddStep}>
            <Text style={dynamicStyles.addStepButtonText}>add step</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: theme.buttonPrimaryBg }, !canSave && styles.saveButtonDisabled]}
        disabled={!canSave}
        onPress={handleSave}
      >
        <Text style={[styles.saveButtonText, { color: theme.buttonPrimaryText }]}>Save Action Plan</Text>
      </Pressable>

      {!canSave && <Text style={[styles.helperText, { color: theme.textMuted }]}>fill in at least 2 steps to save.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 30, paddingBottom: 40, alignItems: 'center', flexGrow: 1 },
  logo: { alignSelf: 'center', marginBottom: 20 },
  
  headerCard: { borderRadius: 24, padding: 0, marginBottom: 24, width: '100%', overflow: 'hidden' },
  cardUpperBlock: { width: '100%', paddingTop: 20, paddingBottom: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  iconWrapper: { marginRight: 6, justifyContent: 'center', alignItems: 'center' },
  
  dividerWrapperContainer: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  card70PercentDivider: { width: '70%', height: 1 },
  
  cardLowerBlock: { width: '100%', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, alignItems: 'center' },
  headerTitle: { fontSize: 16, textAlign: 'center', fontFamily: 'Gilroy-Black', fontWeight: '900', },
  headerSubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, fontFamily: 'Gilroy-Regular' },
  
  formContainer: { width: '100%', marginBottom: 12 },
  stepBlock: { marginBottom: 2 },
  fieldLabel: { fontSize: 13, marginTop: 14, marginBottom: 8, fontFamily: 'Gilroy-Bold', fontWeight: '700', textTransform: 'lowercase' },
  
  inputContainer: { flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderRadius: 12, width: '100%', overflow: 'hidden' },
  textInput: { flex: 1, padding: 12, fontSize: 14, fontFamily: 'Gilroy-Regular' },
  deleteButton: { width: 48, height: '100%', alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1 },
  
  suggestionChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 4 },
  suggestionChip: { borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginRight: 8, marginBottom: 8 },
  suggestionChipText: { fontSize: 13, fontFamily: 'Gilroy-SemiBold', fontWeight: '600' },
  
  addStepButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', width: '100%', marginTop: 8 },
  addStepButtonText: { fontWeight: '700', fontSize: 13, fontFamily: 'Gilroy-Bold' },
  
  saveButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', width: '100%', justifyContent: 'center', marginTop: 28, marginBottom: 12 },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontWeight: '700', fontSize: 13, fontFamily: 'Gilroy-Bold' },
  helperText: { textAlign: 'center', fontSize: 11, lineHeight: 16, fontFamily: 'Gilroy-Regular', marginTop: 4 },
});
