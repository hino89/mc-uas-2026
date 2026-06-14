import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, Animated } from 'react-native';
import Paho from 'paho-mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Polyfill for localStorage needed by paho-mqtt
if (!window.localStorage) {
  window.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

export default function App() {
  const [lightData, setLightData] = useState('0');
  const [soundData, setSoundData] = useState('0');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // MQTT Setup
    const clientId = `AndroidClient-${Math.random().toString(16).substr(2, 8)}`;
    
    // HiveMQ Cloud uses port 8884 for Secure WebSockets
    const client = new Paho.Client(
      '1cedb0438eb245fd95ead5a0b1984f21.s1.eu.hivemq.cloud',
      8884,
      '/mqtt',
      clientId
    );

    const onConnect = () => {
      setConnectionStatus('Connected');
      console.log('Connected to HiveMQ Cloud');
      client.subscribe('kelas/monitoring/cahaya');
      client.subscribe('kelas/monitoring/suara');
    };

    const onFailure = (error) => {
      setConnectionStatus('Disconnected');
      console.log('Connection failed:', error.errorMessage);
      
      // Auto-reconnect after 5 seconds
      setTimeout(connectMQTT, 5000);
    };

    const onMessageArrived = (message) => {
      const topic = message.destinationName;
      const payload = message.payloadString;
      
      if (topic === 'kelas/monitoring/cahaya') {
        setLightData(payload);
      } else if (topic === 'kelas/monitoring/suara') {
        setSoundData(payload);
      }
    };

    client.onConnectionLost = onFailure;
    client.onMessageArrived = onMessageArrived;

    const connectMQTT = () => {
      setConnectionStatus('Connecting...');
      client.connect({
        userName: 'esp32-mc',
        password: 'esp32-mc-L',
        useSSL: true,
        onSuccess: onConnect,
        onFailure: onFailure,
      });
    };

    connectMQTT();

    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Classroom</Text>
          <Text style={styles.subtitle}>Environment Monitor</Text>
          <View style={[styles.statusBadge, connectionStatus === 'Connected' ? styles.statusConnected : styles.statusDisconnected]}>
            <Text style={styles.statusText}>{connectionStatus}</Text>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          {/* Light Sensor Card */}
          <View style={[styles.card, styles.lightCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Light Level</Text>
              <Text style={styles.icon}>☀️</Text>
            </View>
            <View style={styles.dataContainer}>
              <Text style={styles.dataValue}>{lightData}</Text>
              <Text style={styles.dataUnit}>Lux</Text>
            </View>
            <Text style={styles.cardDesc}>
              {parseFloat(lightData) < 150 ? 'Too Dim' : (parseFloat(lightData) > 400 ? 'Very Bright' : 'Optimal')}
            </Text>
          </View>

          {/* Sound Sensor Card */}
          <View style={[styles.card, styles.soundCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Noise Level</Text>
              <Text style={styles.icon}>🔊</Text>
            </View>
            <View style={styles.dataContainer}>
              <Text style={styles.dataValue}>{soundData}</Text>
              <Text style={styles.dataUnit}>dB</Text>
            </View>
            <Text style={styles.cardDesc}>
              {parseFloat(soundData) > 70 ? 'Too Noisy' : 'Quiet & Focused'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Data synced via HiveMQ Cloud</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Sleek dark mode background
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#A0A0A0',
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusConnected: {
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
  },
  statusDisconnected: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardsContainer: {
    flex: 1,
    gap: 20,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  lightCard: {
    backgroundColor: '#2D3436', // Dark gray/blue
    borderWidth: 1,
    borderColor: 'rgba(253, 203, 110, 0.3)',
  },
  soundCard: {
    backgroundColor: '#2D3436',
    borderWidth: 1,
    borderColor: 'rgba(116, 185, 255, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    color: '#DFE6E9',
    fontWeight: '500',
  },
  icon: {
    fontSize: 24,
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dataValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dataUnit: {
    fontSize: 20,
    color: '#B2BEC3',
    marginLeft: 8,
    fontWeight: '600',
  },
  cardDesc: {
    marginTop: 16,
    color: '#636E72',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#636E72',
    fontSize: 12,
  }
});
