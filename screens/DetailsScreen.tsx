import React from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';

import { useOhmPipeline } from '../hooks/useOhmPipeline';
import { useTheme } from '../theme/ThemeProvider';
import { OhmTheme } from '../theme/theme';
import OhmLogo from '../components/OhmLogo';
import Icon from '../components/Icon';

export default function DetailsScreen() {
  const { state } = useOhmPipeline();
  const theme = useTheme();
  const styles = makeStyles(theme);

  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.textPrimary} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{state.message}</Text>
      </View>
    );
  }

  const { infrastructure, location } = state.settings;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      {/* Universal Page Header Row Layer with Centered Screen Title */}
      <View style={styles.headerRow}>
        <View style={[styles.boltBox, { borderColor: theme.border }]}>
          <OhmLogo size={12} />
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerMainTitle}>Details & Data</Text>
          <Text style={styles.headerMainTitle}>Sources</Text>
        </View>
        <View style={[styles.settingsIconBox, { backgroundColor: theme.buttonPrimaryBg }]}>
          <Icon name="exit" size={15} color={theme.buttonPrimaryText} />
        </View>
      </View>

      {/* Main Section Content */}
      <Text style={styles.title}>Why you're seeing this risk level</Text>
      <Text style={styles.body}>
        Combines current weather, past outage history, and your building's infrastructure details,
        weighted so long-term patterns count for more than short-term weather alone.
      </Text>

      <Text style={styles.sectionTitleLeft}>Contributing factors</Text>
      <View style={styles.factorItem}>
        {/* Changed from styles.body to styles.factorBodyText */}
        <Text style={styles.factorBodyText}>
          <Text style={styles.factorLabel}>Weather forecast: </Text>
          {state.weatherFactor.reason}
        </Text>
      </View>
      <View style={styles.factorItem}>
        {/* Changed from styles.body to styles.factorBodyText */}
        <Text style={styles.factorBodyText}>
          <Text style={styles.factorLabel}>Historical outage frequency: </Text>
          {state.historyFactor.reason}
        </Text>
      </View>
      <View style={styles.factorItem}>
        {/* Changed from styles.body to styles.factorBodyText */}
        <Text style={styles.factorBodyText}>
          <Text style={styles.factorLabel}>Your infrastructure: </Text>
          {state.infrastructureFactor.reason}
        </Text>
      </View>


      {/* Gray Location Info Card */}
      <View style={styles.locationCard}>
        <Text style={styles.locationCardTitle}>Your location and setup</Text>
        <Text style={styles.locationCardText}>Location: {location.district}</Text>
        <Text style={styles.locationCardText}>
          Feeder type: {infrastructure.feederType === 'not_sure' ? 'Not specified' : infrastructure.feederType}
        </Text>
        <Text style={styles.locationCardText}>
          Building/connection age:{' '}
          {infrastructure.buildingAgeYears !== null ? `${infrastructure.buildingAgeYears} years` : 'Not specified'}
        </Text>
        <Text style={styles.locationCardText}>
          Prior outages per month:{' '}
          {infrastructure.priorOutageFrequencyPerMonth !== null
            ? infrastructure.priorOutageFrequencyPerMonth
            : 'Not specified'}
        </Text>
      </View>

      {/* Right-Aligned Data Sources Block */}
      <Text style={styles.sectionTitleRight}>Data Sources</Text>
      <Text style={styles.factorTextRight}>
        <Text style={styles.factorLabelRight}>Weather: </Text>Open-Meteo
      </Text>
      <Text style={styles.factorTextRight}>
        <Text style={styles.factorLabelRight}>Outage History: </Text>TANGEDCO circulars, via TN Outage
      </Text>
      <Text style={styles.factorTextRight}>
        <Text style={styles.factorLabelRight}>Infrastructure details: </Text>self-reporting by you during setup
      </Text>

      {/* Bottom Center Certainty Block */}
      <Text style={styles.sectionTitleCenter}>A note on certainty</Text>
      <Text style={styles.bodyCenter}>
        This is our best estimate based on available data, not a guarantee. We're built to warn early
        rather than stay silent, so some alerts won't lead to an actual outage.
      </Text>
    </ScrollView>
  );
}
function makeStyles(theme: OhmTheme) {
  return StyleSheet.create({
    content: { padding: 20, paddingTop: 30, paddingBottom: 120, flexGrow: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: theme.background },
    errorText: { color: theme.textMuted, fontFamily: 'Gilroy-Regular' },
    
    // Header Layout Elements
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 },
    boltBox: { width: 36, height: 36, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    settingsIconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    
    // Fixed Centered Title Style
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    // Find these exact keys in your makeStyles function and replace them:

    headerMainTitle: { 
      fontSize: 13,                    // Decreased slightly from 15 to match mockup proportions
      fontWeight: '700', 
      color: theme.textPrimary, 
      textAlign: 'center', 
      fontFamily: 'Gilroy-Bold', 
      lineHeight: 16,                  // Adjusted slightly for a tighter font size stack
    },

    factorBodyText: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 14,
      fontFamily: 'Gilroy-Regular',
      textAlign: 'left', // Keeps this specific content left-aligned
    },

        
    // Typography Header Blocks
    title: { 
      fontSize: 18, 
      fontWeight: '900', 
      marginBottom: 12, 
      color: theme.textPrimary, 
      fontFamily: 'Gilroy-Black', 
      textAlign: 'center'        // Swapped text alignment from 'left' to 'center'
    },
    sectionTitleLeft: { fontWeight: '900', marginTop: 24, marginBottom: 12, fontSize: 15, color: theme.textPrimary, fontFamily: 'Gilroy-Black' },
    sectionTitleRight: { fontWeight: '900', marginTop: 28, marginBottom: 8, fontSize: 15, color: theme.textPrimary, fontFamily: 'Gilroy-Black', textAlign: 'right' },
    sectionTitleCenter: { fontWeight: '900', marginTop: 28, marginBottom: 12, fontSize: 15, color: theme.textPrimary, fontFamily: 'Gilroy-Black', textAlign: 'center' },
    
    // Standard Body Text Elements (Clean Left Alignment)
    body: { 
      color: theme.textSecondary, 
      fontSize: 13, 
      lineHeight: 19, 
      marginBottom: 14, 
      fontFamily: 'Gilroy-Regular', 
      textAlign: 'center',             // Swapped text alignment from 'left' to 'center'
    },
    factorItem: { marginBottom: 4 },
    factorLabel: { fontWeight: '700', color: theme.textPrimary, fontFamily: 'Gilroy-Bold' },
    
    // Right-Aligned Source Elements
    factorTextRight: { color: theme.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'right', marginBottom: 4, fontFamily: 'Gilroy-Regular' },
    factorLabelRight: { fontWeight: '700', color: theme.textPrimary, fontFamily: 'Gilroy-Bold' },
    
    // Centered Certainty Elements
    bodyCenter: { color: theme.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: 'Gilroy-Regular', textAlign: 'center' },
    
    // Gray Location Middle Card Block
    locationCard: { backgroundColor: theme.cardBackgroundAlt || '#E0E0E0', borderRadius: 16, padding: 20, marginTop: 16, marginBottom: 16, alignItems: 'center' },
    locationCardTitle: { fontWeight: '700', fontSize: 13, marginBottom: 12, color: theme.textPrimary, fontFamily: 'Gilroy-Bold', textTransform: 'none' },
    locationCardText: { fontSize: 12, color: theme.textSecondary, marginBottom: 6, fontFamily: 'Gilroy-Medium', textAlign: 'center' },
  });
}
