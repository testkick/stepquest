import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExplorerHUD } from '@/components/ExplorerHUD';
import { PulsingMarker } from '@/components/PulsingMarker';
import { useLocation } from '@/hooks/useLocation';
import { usePedometer } from '@/hooks/usePedometer';
import { Colors, Spacing, BorderRadius, Shadows, FontSizes } from '@/constants/theme';

// Only import MapView on native platforms
let MapView: typeof import('react-native-maps').default | null = null;
let Marker: typeof import('react-native-maps').Marker | null = null;
let PROVIDER_GOOGLE: typeof import('react-native-maps').PROVIDER_GOOGLE | undefined = undefined;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

// Custom map style for Urban Explorer theme
const mapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f5f5dc' }], // Map Parchment background
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#263238' }], // Deep Charcoal text
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f5dc' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#ddd' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#FF6F00' }], // Waypoint Orange for highways
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#c8e6c9' }], // Light green for parks
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2E7D32' }], // Forest Green text
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#b3e5fc' }], // Light blue for water
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0288d1' }],
  },
];

// Web fallback component
const WebMapFallback: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.webFallbackContainer}>
      {/* Decorative map-like background pattern */}
      <View style={styles.webFallbackPattern}>
        {/* Grid lines */}
        {[...Array(8)].map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLineHorizontal,
              { top: `${(i + 1) * 12}%` },
            ]}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLineVertical,
              { left: `${(i + 1) * 16}%` },
            ]}
          />
        ))}
      </View>

      {/* Central content */}
      <View style={[styles.webFallbackContent, { paddingTop: insets.top + 120 }]}>
        {/* Pulsing marker preview */}
        <View style={styles.markerPreviewContainer}>
          <PulsingMarker size={32} />
        </View>

        {/* Icon */}
        <View style={styles.webIconContainer}>
          <Ionicons name="map" size={64} color={Colors.primary} />
        </View>

        {/* Message */}
        <Text style={styles.webFallbackTitle}>Explorer Map</Text>
        <Text style={styles.webFallbackSubtitle}>
          Interactive map view is available on mobile devices
        </Text>

        {/* Device indicator */}
        <View style={styles.deviceIndicator}>
          <Ionicons name="phone-portrait-outline" size={20} color={Colors.accent} />
          <Text style={styles.deviceIndicatorText}>
            Open on iOS or Android for the full experience
          </Text>
        </View>

        {/* Feature list */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <Text style={styles.featureText}>Real-time GPS tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="footsteps" size={18} color={Colors.primary} />
            <Text style={styles.featureText}>Step counting & distance</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="compass" size={18} color={Colors.primary} />
            <Text style={styles.featureText}>Custom explorer markers</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function ExplorerDashboard() {
  const mapRef = useRef<InstanceType<typeof import('react-native-maps').default> | null>(null);
  const insets = useSafeAreaInsets();
  const [isMapReady, setIsMapReady] = useState(false);

  const { location, isLoading, errorMsg: locationError } = useLocation();
  const { steps, isAvailable: isPedometerAvailable, errorMsg: pedometerError } = usePedometer();

  const isWeb = Platform.OS === 'web';

  // Center map on user when location updates (only on native)
  useEffect(() => {
    if (!isWeb && location && mapRef.current && isMapReady) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
        1000
      );
    }
  }, [location, isMapReady, isWeb]);

  const handleCenterOnUser = () => {
    if (!isWeb && location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
        500
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Initializing Explorer...</Text>
        <Text style={styles.loadingSubtext}>Acquiring location and sensors</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isWeb ? 'dark' : 'light'} />

      {/* Map View - Native only */}
      {!isWeb && MapView && Marker ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={mapStyle}
          initialRegion={
            location
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA,
                }
              : undefined
          }
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          onMapReady={() => setIsMapReady(true)}
        >
          {/* Custom User Location Marker */}
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
            >
              <PulsingMarker size={20} />
            </Marker>
          )}
        </MapView>
      ) : (
        <WebMapFallback />
      )}

      {/* HUD Overlay - Works on all platforms */}
      <ExplorerHUD steps={steps} isAvailable={isPedometerAvailable} />

      {/* Recenter Button - Native only */}
      {!isWeb && (
        <TouchableOpacity
          style={[
            styles.recenterButton,
            { bottom: insets.bottom + 120 },
          ]}
          onPress={handleCenterOnUser}
          activeOpacity={0.8}
        >
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Permission/Error Banner */}
      {(locationError || pedometerError) && !isWeb && (
        <View style={[styles.errorBanner, { bottom: insets.bottom + 180 }]}>
          <Ionicons name="warning" size={16} color={Colors.accent} />
          <Text style={styles.errorText}>
            {locationError || pedometerError}
          </Text>
        </View>
      )}

      {/* Future Mission Cards placeholder area indicator */}
      <View
        style={[
          styles.missionCardPlaceholder,
          { bottom: insets.bottom + Spacing.md },
        ]}
      >
        <View style={styles.placeholderLine} />
        <Text style={styles.placeholderText}>Mission Cards Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingSubtext: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
    opacity: 0.6,
  },
  map: {
    flex: 1,
  },
  recenterButton: {
    position: 'absolute',
    right: Spacing.md,
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  errorBanner: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 111, 0, 0.9)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  missionCardPlaceholder: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    opacity: 0.5,
  },
  placeholderLine: {
    width: 40,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  placeholderText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  // Web fallback styles
  webFallbackContainer: {
    flex: 1,
    backgroundColor: Colors.secondary,
    position: 'relative',
    overflow: 'hidden',
  },
  webFallbackPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  webFallbackContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  markerPreviewContainer: {
    marginBottom: Spacing.xl,
  },
  webIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.large,
  },
  webFallbackTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  webFallbackSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  deviceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 111, 0, 0.1)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  deviceIndicatorText: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: '500',
  },
  featureList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    opacity: 0.8,
  },
});
