/**
 * Device Identity Service for Stepquest
 * Handles device identification and App Tracking Transparency permission
 */

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as TrackingTransparency from 'expo-tracking-transparency';

export interface DeviceInfo {
  deviceId: string;
  trackingStatus: TrackingTransparency.PermissionStatus | null;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Request App Tracking Transparency permission (iOS only)
 * This is required on iOS to access the IDFA (Advertising Identifier)
 */
export const requestTrackingPermission = async (): Promise<TrackingTransparency.PermissionStatus | null> => {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error requesting tracking permission:', error);
    return null;
  }
};

/**
 * Get the current tracking permission status (iOS only)
 */
export const getTrackingStatus = async (): Promise<TrackingTransparency.PermissionStatus | null> => {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error getting tracking status:', error);
    return null;
  }
};

/**
 * Get the unique device identifier
 * - iOS: Uses IDFV (Identifier for Vendor) - available without permission
 * - Android: Uses Android ID
 * - Web: Returns a generated ID or null
 */
export const getDeviceId = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'ios') {
      // IDFV is always available and doesn't require tracking permission
      // It's unique per vendor (app developer) per device
      const idfv = await Application.getIosIdForVendorAsync();
      return idfv;
    } else if (Platform.OS === 'android') {
      // Android ID is available without special permissions
      const androidId = Application.getAndroidId();
      return androidId;
    } else {
      // Web platform - return null (could implement localStorage-based ID)
      return null;
    }
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
};

/**
 * Get the Advertising ID (IDFA on iOS, AAID on Android)
 * Requires tracking permission on iOS
 */
export const getAdvertisingId = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'ios') {
      // Check if tracking is allowed first
      const status = await getTrackingStatus();
      if (status !== TrackingTransparency.PermissionStatus.GRANTED) {
        console.log('Tracking not granted, cannot get IDFA');
        return null;
      }

      // IDFA would require native code, so we fall back to IDFV
      // In a production app with native modules, you'd use react-native-idfa
      return await Application.getIosIdForVendorAsync();
    } else if (Platform.OS === 'android') {
      // For Android, we'd need Google Play Services for AAID
      // Fall back to Android ID
      return Application.getAndroidId();
    }

    return null;
  } catch (error) {
    console.error('Error getting advertising ID:', error);
    return null;
  }
};

/**
 * Get complete device information
 * Requests tracking permission on iOS and retrieves device ID
 */
export const getDeviceInfo = async (requestPermission: boolean = false): Promise<DeviceInfo> => {
  let trackingStatus: TrackingTransparency.PermissionStatus | null = null;

  // Request or check tracking permission on iOS
  if (Platform.OS === 'ios') {
    if (requestPermission) {
      trackingStatus = await requestTrackingPermission();
    } else {
      trackingStatus = await getTrackingStatus();
    }
  }

  // Get device ID
  const deviceId = await getDeviceId();

  return {
    deviceId: deviceId || 'unknown',
    trackingStatus,
    platform: Platform.OS as 'ios' | 'android' | 'web',
  };
};

/**
 * Initialize device tracking
 * Call this when the app starts or when user signs in
 */
export const initializeDeviceTracking = async (): Promise<DeviceInfo> => {
  // Request tracking permission on iOS (required for ATT compliance)
  const deviceInfo = await getDeviceInfo(true);

  console.log('Device info initialized:', {
    platform: deviceInfo.platform,
    hasDeviceId: !!deviceInfo.deviceId,
    trackingStatus: deviceInfo.trackingStatus,
  });

  return deviceInfo;
};
