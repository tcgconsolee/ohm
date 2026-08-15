import { StyleSheet, Text, View } from 'react-native';

import OnboardingStepFrame from './OnboardingStepFrame';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function DisclosureStep({ onNext, onBack }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <OnboardingStepFrame
      iconName="disclosure-onboarding"
      title="Disclosure"
      subtitle="Here's exactly what we do with your information."
      stepNumber={5}
      totalSteps={5}
      onBack={onBack}
      onNext={onNext}
      nextLabel="I understand"
    >
      {/* Centered card frame adapting flawlessly to your design tokens */}
      <View style={styles.disclosureCard}>
        <Text style={styles.disclosureHeading}>What we collect</Text>
        <Text style={styles.disclosureBody}>
          Your location, business details, and setup preferences from the previous steps.
        </Text>

        <Text style={styles.disclosureHeading}>Where it stays</Text>
        <Text style={styles.disclosureBody}>Entirely on your device. Nothing is sent to a server, ever.</Text>

        <Text style={styles.disclosureHeading}>What it's used for</Text>
        <Text style={styles.disclosureBody}>
          Calculating your personal outage risk score. We also keep a record of outage confirmations
          you provide, so we can track how accurate our alerts are.
        </Text>

        <Text style={styles.disclosureHeading}>What we don't do</Text>
        <Text style={styles.disclosureBody}>We don't sell, share, or transmit your data anywhere.</Text>
      </View>

      <Text style={styles.controlNote}>
        You're always in control. You can review or change this anytime in Settings.
      </Text>
    </OnboardingStepFrame>
  );
}


import { OhmTheme } from '../../theme/theme';

function makeStyles(theme: OhmTheme) {
  const isLight = theme.mode === 'light';

  return StyleSheet.create({
    // Perfectly aligns background container colors with dark/light rules
    disclosureCard: { 
      borderRadius: 24, 
      padding: 20, 
      marginBottom: 20,
      backgroundColor: isLight ? '#383839' : theme.cardBackgroundAlt
    },
    disclosureHeading: { 
      color: '#FFFFFF', 
      fontWeight: '700', 
      fontSize: 13, 
      marginBottom: 4, 
      marginTop: 12, 
      fontFamily: 'Gilroy-Bold' 
    },
    disclosureBody: { 
      color: '#FFFFFFCC', 
      fontSize: 12, 
      lineHeight: 18, 
      fontFamily: 'Gilroy-Regular' 
    },
    controlNote: { 
      textAlign: 'center', 
      fontSize: 11, 
      lineHeight: 16, 
      marginBottom: 10, 
      color: theme.textSecondary,
      fontFamily: 'Gilroy-Regular' 
    },
  });
}
