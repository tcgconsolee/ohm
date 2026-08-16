import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeProvider';
import { OhmTheme } from '../theme/theme';
import OhmLogo from '../components/OhmLogo';
import Icon from '../components/Icon';

export default function DisclosureScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const styles = makeStyles(theme);
  const isLight = theme.mode === 'light';

  // Multi-Tone Background Configuration Blocks
  const upperBgColor = isLight ? '#A2A3AA' : '#2C2C2D';
  const lowerBgColor = isLight ? '#BCBDC1' : '#383839';
  const dividerColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.7)';

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      {/* Brand Vector Logo Badge */}
      <OhmLogo size={18} style={styles.logo} />

      {/* Styled Header Card Area splitting background tones */}
      <View style={styles.headerCard}>
        {/* Upper Segment Area with Vector Icon Embedded */}
        <View style={[styles.cardUpperBlock, { backgroundColor: upperBgColor }]}>
          <View style={styles.iconWrapper}>
            <Icon name="disclosure-onboarding" size={22} color={theme.textPrimary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Disclosure
          </Text>
        </View>

        {/* 70% Opacity White Divider Axis Line */}
        <View style={[styles.dividerWrapperContainer, { backgroundColor: lowerBgColor }]}>
          <View style={[styles.card70PercentDivider, { backgroundColor: dividerColor }]} />
        </View>

        {/* Lower Segment Area (Lighter Background) */}
        <View style={[styles.cardLowerBlock, { backgroundColor: lowerBgColor }]}>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Here's exactly what we do with your information.
          </Text>
        </View>
      </View>

      {/* High-Contrast Disclosure Container Card Layer */}
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

      {/* Standalone Action Back Navigation Target Button Frame */}
      <Pressable style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>I understand</Text>
      </Pressable>
    </ScrollView>
  );
}
function makeStyles(theme: OhmTheme) {
  const isLight = theme.mode === 'light';

  return StyleSheet.create({
    content: { padding: 24, paddingTop: 60, paddingBottom: 60, flexGrow: 1 },
    logo: { alignSelf: 'center', marginBottom: 20 },
    
    // Split Multi-Tone Card Layout Architecture System
    headerCard: { borderRadius: 24, padding: 0, marginBottom: 24, width: '100%', overflow: 'hidden' },
    cardUpperBlock: { width: '100%', paddingTop: 20, paddingBottom: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    iconWrapper: { marginRight: 8, justifyContent: 'center', alignItems: 'center' },
    
    dividerWrapperContainer: { width: '100%', alignItems: 'center', justifyContent: 'center' },
    card70PercentDivider: { width: '70%', height: 1 },
    
    cardLowerBlock: { width: '100%', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, alignItems: 'center' },
    headerTitle: { fontWeight: '900', fontSize: 16, textAlign: 'center', fontFamily: 'Gilroy-Black' },
    headerSubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, fontFamily: 'Gilroy-Regular' },
    
    // Core Informational Text Container Block
    disclosureCard: {
      borderRadius: 24,
      padding: 24,
      marginBottom: 24,
      backgroundColor: '#383839', // Standardized solid dark container tracking block
    },
    disclosureHeading: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginBottom: 4, marginTop: 16, fontFamily: 'Gilroy-Bold' },
    disclosureBody: { color: '#FFFFFFCC', fontSize: 12, lineHeight: 18, fontFamily: 'Gilroy-Regular' },
    
    controlNote: { 
      textAlign: 'center', 
      fontSize: 11, 
      lineHeight: 16, 
      marginBottom: 28, 
      color: theme.textSecondary, 
      fontFamily: 'Gilroy-Regular' 
    },
    
    // Unified Primary Dismissal Action Targets
    button: { 
      backgroundColor: theme.buttonPrimaryBg, 
      borderRadius: 12, 
      paddingVertical: 14, 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '100%',
      marginTop: 'auto' // Smoothly anchors button toward layout bases on expansive viewports
    },
    buttonText: { color: theme.buttonPrimaryText, fontWeight: '700', fontSize: 13, fontFamily: 'Gilroy-Bold' },
  });
}
