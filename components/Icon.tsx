import { SvgProps } from 'react-native-svg';

import AccuracyIcon from '../assets/accuracy-icon.svg';
import ActionPlanEditIcon from '../assets/action-plan-edit-icon.svg';
import ActionPlanIcon from '../assets/action-plan-icon.svg';
import BadWeatherIcon from '../assets/bad-weather-icon.svg';
import ConfirmationIcon from '../assets/confirmation-icon.svg';
import DetailsIcon from '../assets/details-icon.svg';
import DisclosureOnboardingIcon from '../assets/disclosure-icon-onboarding.svg';
import ExitIcon from '../assets/exit-icon.svg';
import InfrastructureOnboardingIcon from '../assets/infrastructure-icon-onboarding.svg';
import InfrastructureWhiteIcon from '../assets/infrastructure-icon-white.svg';
import LocationOnboardingIcon from '../assets/location-icon-onboarding.svg';
import PreferencesOnboardingIcon from '../assets/preferences-icon-onboarding.svg';
import ReportIcon from '../assets/report-icon.svg';
import ScheduledMaintenanceIcon from '../assets/scheduled-maintainance-icon.svg';
import SettingsIcon from '../assets/settings-icon.svg';
import WifiBarFullIcon from '../assets/wifi-bar-full-icon.svg';
import WifiBarLowIcon from '../assets/wifi-bar-low-icon.svg';
import HomeIcon from '../assets/home-icon.svg';
import NoDataGraphIcon from '../assets/nodata-graph-icon.svg';
import DeleteIcon from '../assets/action-plan-delete-icon.svg'

export const ICONS = {
  home: HomeIcon,
  accuracy: AccuracyIcon,
  'action-plan-edit': ActionPlanEditIcon,
  'action-plan': ActionPlanIcon,
  'bad-weather': BadWeatherIcon,
  confirmation: ConfirmationIcon,
  details: DetailsIcon,
  'disclosure-onboarding': DisclosureOnboardingIcon,
  exit: ExitIcon,
  infrastructure: InfrastructureWhiteIcon,
  'infrastructure-onboarding': InfrastructureOnboardingIcon,
  'location-onboarding': LocationOnboardingIcon,
  'preferences-onboarding': PreferencesOnboardingIcon,
  report: ReportIcon,
  'scheduled-maintenance': ScheduledMaintenanceIcon,
  settings: SettingsIcon,
  'wifi-bar-full': WifiBarFullIcon,
  'wifi-bar-low': WifiBarLowIcon,
  'nodata-graph': NoDataGraphIcon,
  'delete-icon': DeleteIcon
} as const;

export type IconName = keyof typeof ICONS;

interface Props extends SvgProps {
  name: IconName;
  size?: number;
  color: string; // required - caller passes theme.textPrimary/etc so icons invert correctly per theme
}

// Single entry point for every SVG icon in the app. Icons are assumed to be
// single-color assets (no separate light/dark files exist in the asset
// set) - dark mode inversion is handled by passing the correct theme color
// as `color`, which overrides the SVG's fill via react-native-svg's props
// pass-through. If a given icon's SVG has hardcoded fill colors baked in
// rather than inheriting from props, this override will have no visible
// effect on that icon - worth checking each icon renders correctly in both
// themes once seen live.
export default function Icon({ name, size = 24, color, ...rest }: Props) {
  const SvgIcon = ICONS[name];
  if (!SvgIcon) return null;

  return (
    <SvgIcon 
      width={size} 
      height={size} 
      // Sets the global ink token so children inheriting currentColor switch colors dynamically
      color={color} 
      // Forces the fill layer container parameters to track your system tokens
      fill="currentColor"
      {...rest} 
    />
  );
}

