import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Pressable, Animated, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Mask, Rect, Path, G } from 'react-native-svg';

import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import { useGilroyFonts } from './theme/useGilroyFonts';
import { isOnboardingComplete } from './core/onboardingStatus';

import SplashScreen from './screens/SplashScreen';
import OnboardingFlow from './screens/onboarding/OnboardingFlow';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import AccuracyScreen from './screens/AccuracyScreen';
import SettingsScreen from './screens/SettingsScreen';
import ActionPlanScreen from './screens/ActionPlanScreen';
import ReportScreen from './screens/ReportScreen';
import DisclosureScreen from './screens/DisclosureScreen';

import Icon from './components/Icon';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AnimatedG = Animated.createAnimatedComponent(G);

function MainTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(1); // Default to Home (index 1)

  const animationValue = useRef(new Animated.Value(1)).current;

  const TAB_ROUTES = [
    { name: 'Accuracy', component: AccuracyScreen, icon: 'accuracy' },
    { name: 'Home', component: HomeScreen, icon: 'home' },
    { name: 'Details', component: DetailsScreen, icon: 'details' },
    { name: 'Settings', component: SettingsScreen, icon: 'settings' },
  ];

  const totalTabs = TAB_ROUTES.length;
  const tabWidth = containerWidth / totalTabs;

  // Spring animation engine tracking active slider coordinates
  useEffect(() => {
    Animated.spring(animationValue, {
      toValue: activeIndex,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
  }, [activeIndex]);

  const translateX = animationValue.interpolate({
    inputRange: [0, totalTabs - 1],
    outputRange: [0, containerWidth - tabWidth],
    extrapolate: 'clamp',
  });

  const calculatedBarHeight = 64 + (insets.bottom > 0 ? insets.bottom : 12);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={({ state, descriptors, navigation }) => {
        const themeBgColor = theme.navBarBg || '#B3B7BC';

        // SYNC INTER-TAB ROUTING STATE JUMPS:
        // Updates the layout indices automatically when parent screens trigger cross-navigation transitions
        if (state.index !== activeIndex) {
          setActiveIndex(state.index);
        }

        const leftCornerPath = state.index === 0 ? 'M 0 0' : 'M 0 24 Q 0 0 24 0';
        const rightCornerPath = state.index === totalTabs - 1
          ? `H ${containerWidth} V ${calculatedBarHeight}`
          : `H ${containerWidth - 24} Q ${containerWidth} 0 ${containerWidth} 24 V ${calculatedBarHeight}`;

        return (
          <View
            style={[styles.tabBarWrapperContainer, { height: calculatedBarHeight + 30 }]}
            onLayout={(event) => {
              setContainerWidth(event.nativeEvent.layout.width);
            }}
          >
            {/* Seamless Mask overlay rendering a sliding valley shape */}
            {containerWidth > 0 && (
              <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', top: 30 }]}>
                <Svg width={containerWidth} height={calculatedBarHeight}>
                  <Mask id="valleyMask">
                    <Rect width={containerWidth} height={calculatedBarHeight} fill="#FFFFFF" />
                    <AnimatedG style={{ transform: [{ translateX }] }}>
                      <Path
                        d={`
                          M ${tabWidth / 2 - 50} 0
                          H ${tabWidth / 2 - 42}
                          Q ${tabWidth / 2 - 24} 0 ${tabWidth / 2 - 20} 14
                          A 24 24 0 0 0 ${tabWidth / 2 + 20} 14
                          Q ${tabWidth / 2 + 24} 0 ${tabWidth / 2 + 42} 0
                          H ${tabWidth / 2 + 50}
                          Z
                        `}
                        fill="#000000"
                      />
                    </AnimatedG>
                  </Mask>

                  <Path
                    d={`
                      ${leftCornerPath}
                      H ${containerWidth - 42}
                      ${rightCornerPath}
                      H 0
                      Z
                    `}
                    fill={themeBgColor}
                    mask="url(#valleyMask)"
                  />
                </Svg>
              </View>
            )}

            {/* Interactive Tab Icon row items grid */}
            <View style={[
              styles.tabItemsInteractiveRow,
              {
                height: calculatedBarHeight,
                paddingBottom: insets.bottom > 0 ? insets.bottom+6 : 8
              }
            ]}>
              {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const currentConfig = TAB_ROUTES.find(t => t.name === route.name);
                const currentIcon = currentConfig ? currentConfig.icon : 'home';

                const onPress = () => {
                  setActiveIndex(index);
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                };

                return (
                  <Pressable
                    key={route.key}
                    onPress={onPress}
                    style={styles.singleTabColumnAnchor}
                  >
                    <Animated.View style={[
                      isFocused ? styles.elevatedActiveCircle : styles.standardInactiveCircle,
                      {
                        transform: [{
                          translateY: animationValue.interpolate({
                            inputRange: [index - 0.5, index, index + 0.5],
                            outputRange: [0, isFocused ? -32 : 0, 0],
                            extrapolate: 'clamp'
                          })
                        }],
                        backgroundColor: isFocused ? themeBgColor : 'transparent',
                        opacity: isFocused ? 1 : 0.4
                      }
                    ]}>
                      <Icon 
                        name={currentIcon as any} 
                        size={22} 
                        color={isFocused ? (theme.textPrimary || '#000000') : (theme.textPrimary || '#FFFFFF')} 
                      />
                    </Animated.View>

                    <Text style={[
                      styles.tabTypographyLabel,
                      {
                        color: isFocused ? (theme.navActiveTint || '#000000') : (theme.navInactiveTint || '#FFFFFF'),
                        opacity: isFocused ? 1 : 0.4
                      }
                    ]}>
                      {route.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      }}
    >
      {TAB_ROUTES.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} options={{ headerShown: false }} />
      ))}
    </Tab.Navigator>
  );
}

type AppPhase = 'splash' | 'onboarding' | 'main';

function RootNavigator() {
  const theme = useTheme();
  const [phase, setPhase] = useState<AppPhase>('splash');

  useEffect(() => {
    (window as any).triggerSetupExplainerRevisit = () => {
      setPhase('onboarding'); 
    };
    return () => {
      delete (window as any).triggerSetupExplainerRevisit;
    };
  }, []);

  const handleSplashFinished = async () => {
    const complete = await isOnboardingComplete();
    setPhase(complete ? 'main' : 'onboarding');
  };

  if (phase === 'splash') {
    return <SplashScreen onFinished={handleSplashFinished} />;
  }

  if (phase === 'onboarding') {
    return <OnboardingFlow onComplete={() => setPhase('main')} />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.mode === 'dark',
        colors: {
          primary: theme.textPrimary,
          background: theme.background,
          card: theme.cardBackground,
          text: theme.textPrimary,
          border: theme.border,
          notification: theme.riskHigh,
        },
        fonts: {
          regular: { fontFamily: 'Gilroy-Regular', fontWeight: '400' },
          medium: { fontFamily: 'Gilroy-Medium', fontWeight: '500' },
          bold: { fontFamily: 'Gilroy-Bold', fontWeight: '700' },
          heavy: { fontFamily: 'Gilroy-Heavy', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="ActionPlan"
          component={ActionPlanScreen}
          options={{ presentation: 'modal', headerShown: true, title: '' }}
        />
        <Stack.Screen
          name="Report"
          component={ReportScreen}
          options={{ presentation: 'modal', headerShown: true, title: '' }}
        />
        <Stack.Screen
          name="Disclosure"
          component={DisclosureScreen}
          options={{ presentation: 'modal', headerShown: true, title: '' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useGilroyFonts();

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.appLoadingContainer}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (fontError) {
    console.warn('Gilroy fonts failed to load, falling back to system font:', fontError);
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appLoadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0B' },
  tabBarWrapperContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent', elevation: 0, justifyContent: 'flex-end' },
  mainSolidBarBackground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tabItemsInteractiveRow: { flexDirection: 'row', width: '100%', alignItems: 'flex-end', zIndex: 10 },
  singleTabColumnAnchor: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  standardInactiveCircle: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 0 },
  elevatedActiveCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  tabTypographyLabel: { fontFamily: 'Gilroy-Bold', fontSize: 12, fontWeight: '700', textAlign: 'center', width: '100%' },
});
