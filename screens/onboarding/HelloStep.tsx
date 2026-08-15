import { StyleSheet, Text, View, Pressable, Image, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import OhmLogo from '../../components/OhmLogo';

const circleBg = require('../../assets/hello-screen-circle.png');
const crossBg = require('../../assets/hello-screen-cross.png');

interface Props {
  onOkay: () => void;
  onUnsure: () => void;
}

export default function HelloStep({ onOkay, onUnsure }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const isLight = theme.mode === 'light';

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand Logo Badge */}
      <OhmLogo size={22} style={styles.logo} />

      {/* Card Container Area */}
      <View style={[styles.card, { backgroundColor: isLight ? '#BCBDC1' : theme.cardBackground }]}>
        
        {/* Background Visual Asset Overlays with bright white translucency masking */}
        <Image 
          source={circleBg} 
          style={[styles.topRightGraphic, isLight && { tintColor: '#FFFFFF', opacity: 0.95 }]} 
          resizeMode="contain" 
        />
        <Image 
          source={crossBg} 
          style={[styles.leftGraphic, isLight && { tintColor: '#FFFFFF', opacity: 0.95 }]} 
          resizeMode="contain" 
        />

        {/* Upper Card Segment (Divided Header Context Block) */}
        <View style={styles.cardUpperBlock}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Hello!</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Welcome to Ohm, your path to a business that's never caught off guard by a power cut again
          </Text>
        </View>

        {/* Lower Card Segment (Aligned Pill Outline Badges) */}
        <View style={styles.cardLowerBlock}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Data stays on-device</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Free, no-cost</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>No signup required</Text>
          </View>
        </View>
      </View>

      {/* Main Explanatory Copy Description Blocks */}
      <Text style={[styles.footerText, { color: theme.textSecondary }]}>
        We'll ask you a few quick questions to understand your location and setup, then start giving
        you advance warning before outages happen, so you can plan ahead instead of reacting.
      </Text>

      {/* Interactive Command Action Target Row */}
      <View style={styles.buttonRow}>
        <Pressable style={styles.secondaryButton} onPress={onUnsure}>
          <Text style={styles.secondaryButtonText}>
            I'm unsure
          </Text>
        </Pressable>
        <Pressable style={[styles.primaryButton, { backgroundColor: theme.buttonPrimaryBg }]} onPress={onOkay}>
          <Text style={[styles.primaryButtonText, { color: theme.buttonPrimaryText }]}>Okay</Text>
        </Pressable>
      </View>

      {/* Footnote Step Navigation Capsule Progress Row */}
      <View style={styles.progressRow}>
        <Text style={styles.progressArrowDisabled}>←</Text>
        <View style={styles.progressLine} />
        <Text style={[styles.progressText, { color: theme.textPrimary }]}>1</Text>
        <View style={styles.progressLine} />
        <Pressable onPress={onOkay}>
          <Text style={[styles.progressArrowActive, { color: theme.textPrimary }]}>→</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
import { OhmTheme } from '../../theme/theme';

function makeStyles(theme: OhmTheme) {
  const isLight = theme.mode === 'light';
  
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
    
    logo: { alignSelf: 'center', marginBottom: 28 },
    
    card: { 
      width: '100%', 
      borderRadius: 28, 
      padding: 0, 
      alignItems: 'center', 
      marginBottom: 28, 
      position: 'relative', 
      overflow: 'hidden',
    },
    
    // Position metrics for background asset layers
    topRightGraphic: { 
      position: 'absolute', 
      top: -10, 
      right: -10, 
      width: 120, 
      height: 120, 
      opacity: 0.25, 
      zIndex: 1 
    },
    leftGraphic: { 
      position: 'absolute', 
      bottom: 30, 
      left: -20, 
      width: 110, 
      height: 110, 
      opacity: 0.22, 
      zIndex: 1 
    },

    cardUpperBlock: { 
      width: '100%', 
      paddingHorizontal: 24, 
      paddingTop: 32, 
      paddingBottom: 24, 
      alignItems: 'center', 
      borderBottomWidth: 1, 
      borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)', 
      zIndex: 2 
    },
    cardLowerBlock: { 
      width: '100%', 
      paddingHorizontal: 40,  
      paddingTop: 28, 
      paddingBottom: 32, 
      alignItems: 'center', 
      zIndex: 2 
    },
    
    title: { fontSize: 22, fontWeight: '900', marginBottom: 16, textAlign: 'center', fontFamily: 'Gilroy-Black' },
    body: { textAlign: 'center', fontSize: 13, lineHeight: 19, fontFamily: 'Gilroy-Regular' },
    
    badge: { 
      width: '100%', 
      borderWidth: 1, 
      borderColor: isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.35)', 
      borderRadius: 14, 
      paddingVertical: 10, 
      marginBottom: 12, 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'transparent' 
    },
    badgeText: { 
      fontSize: 12, 
      color: isLight ? '#000000' : '#FFFFFF', 
      fontFamily: 'Gilroy-Medium', 
      fontWeight: '500' 
    },
    
    footerText: { textAlign: 'center', fontSize: 12, lineHeight: 15, marginBottom: 32, paddingHorizontal: 8, fontFamily: 'Gilroy-Medium' },
    
    buttonRow: { flexDirection: 'row', width: '100%', marginBottom: 36 },
    
    secondaryButton: { 
      flex: 1, 
      borderWidth: 1, 
      borderRadius: 12, 
      paddingVertical: 14, 
      alignItems: 'center', 
      marginRight: 12, 
      justifyContent: 'center',
      borderColor: isLight ? '#000000' : '#FFFFFF',
      backgroundColor: isLight ? '#FFFFFF' : '#000000', 
    },
    secondaryButtonText: { 
      fontWeight: '700', 
      fontSize: 13, 
      fontFamily: 'Gilroy-Bold',
      color: isLight ? '#000000' : '#FFFFFF',
    },
    
    primaryButton: { 
      flex: 1, 
      borderRadius: 12, 
      paddingVertical: 14, 
      alignItems: 'center', 
      justifyContent: 'center',
    },
    primaryButtonText: { fontWeight: '700', fontSize: 13, fontFamily: 'Gilroy-Bold' },
    
    progressRow: { flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', paddingBottom: 10 },
    progressLine: { width: 44, height: 1, backgroundColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)', marginHorizontal: 16 },
    progressText: { fontSize: 13, fontWeight: '700', fontFamily: 'Gilroy-Bold', minWidth: 10, textAlign: 'center' },
    progressArrowDisabled: { fontSize: 18, color: isLight ? '#D0D0D0' : '#3A3A3A', fontFamily: 'Gilroy-Bold' },
    progressArrowActive: { fontSize: 18, fontFamily: 'Gilroy-Bold' },
  });
}
