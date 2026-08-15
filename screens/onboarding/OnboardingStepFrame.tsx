import { ReactNode } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import OhmLogo from '../../components/OhmLogo';
import Icon, { IconName } from '../../components/Icon';

interface Props {
  iconName: IconName; 
  title: string;
  subtitle: string;
  stepNumber: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  children: ReactNode;
}

export default function OnboardingStepFrame({
  iconName,
  title,
  subtitle,
  stepNumber,
  totalSteps,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  children,
}: Props) {
  const theme = useTheme();
  const isLight = theme.mode === 'light';

  // Multi-Tone Background Configuration Blocks
  const upperBgColor = isLight ? '#A2A3AA' : '#2C2C2D';
  const lowerBgColor = isLight ? '#BCBDC1' : '#383839';
  const dividerColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.7)'; 

  return (
    // The main parent wrapper is now a root ScrollView that spans the entire window viewport
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
            <Icon name={iconName} size={16} color={theme.textPrimary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {title}
          </Text>
        </View>

        {/* 70% Opacity White Divider Axis Line */}
        <View style={[styles.dividerWrapperContainer, { backgroundColor: lowerBgColor }]}>
          <View style={[styles.card70PercentDivider, { backgroundColor: dividerColor }]} />
        </View>

        {/* Lower Segment Area (Lighter Background) */}
        <View style={[styles.cardLowerBlock, { backgroundColor: lowerBgColor }]}>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>

      {/* Form Input Context Elements Layout View Block */}
      <View style={styles.formContainer}>
        {children}
      </View>

      {/* Action Next Button Target Layout Area */}
      {onNext && (
        <Pressable
          style={[styles.nextButton, { backgroundColor: theme.buttonPrimaryBg }, nextDisabled && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={nextDisabled}
        >
          <Text style={[styles.nextButtonText, { color: theme.buttonPrimaryText }]}>{nextLabel ?? 'Next'}</Text>
        </Pressable>
      )}

      {/* Unified Step Timeline Progress Row Axis */}
      <View style={styles.progressRow}>
        {onBack ? (
          <Pressable onPress={onBack}>
            <Text style={[styles.arrow, { color: theme.textPrimary }]}>←</Text>
          </Pressable>
        ) : (
          <Text style={[styles.arrow, { color: isLight ? '#D0D0D0' : '#3A3A3A' }]}>←</Text>
        )}
        <View style={[styles.progressLine, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)' }]} />
        <Text style={[styles.stepNumber, { color: theme.textPrimary }]}>{stepNumber}</Text>
        <View style={[styles.progressLine, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)' }]} />
        {onNext ? (
          <Pressable onPress={onNext} disabled={nextDisabled}>
            <Text style={[styles.arrow, { color: theme.textPrimary }, nextDisabled && { opacity: 0.3 }]}>→</Text>
          </Pressable>
        ) : (
          <Text style={[styles.arrow, { color: isLight ? '#D0D0D0' : '#3A3A3A' }]}>→</Text>
        )}
      </View>
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
  
  headerTitle: { fontWeight: '900', fontSize: 16, textAlign: 'center', fontFamily: 'Gilroy-Black' },
  headerSubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, fontFamily: 'Gilroy-Regular' },
  
  formContainer: { width: '100%', marginBottom: 12 },
  
  nextButton: { 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    width: '100%', 
    justifyContent: 'center',
    
    // INCREASED FROM 10 TO 28 TO WIDEN THE PADDING BREATHING ROOM:
    marginTop: 28, 
    
    marginBottom: 24 
  },

  nextButtonDisabled: { opacity: 0.4 },
  nextButtonText: { fontWeight: '700', fontSize: 13, fontFamily: 'Gilroy-Bold' },
  
  progressRow: { flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', paddingBottom: 10 },
  progressLine: { width: 50, height: 1, marginHorizontal: 16 },
  arrow: { fontSize: 18, fontFamily: 'Gilroy-Bold' },
  stepNumber: { fontSize: 13, fontWeight: '700', fontFamily: 'Gilroy-Bold', minWidth: 10, textAlign: 'center' },
});
