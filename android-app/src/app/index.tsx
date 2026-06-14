import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, Platform } from 'react-native';
import Paho from 'paho-mqtt';

// Polyfill for localStorage needed by paho-mqtt
if (typeof window !== 'undefined' && !window.localStorage) {
  window.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

export default function App() {
  const [lightData, setLightData] = useState('0');
  const [soundData, setSoundData] = useState('0');
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');

  useEffect(() => {
    const clientId = `AndroidClient-${Math.random().toString(16).substr(2, 8)}`;
    
    const client = new Paho.Client(
      '1cedb0438eb245fd95ead5a0b1984f21.s1.eu.hivemq.cloud',
      8884,
      '/mqtt',
      clientId
    );

    const onConnect = () => {
      setConnectionStatus('CONNECTED');
      client.subscribe('kelas/monitoring/cahaya');
      client.subscribe('kelas/monitoring/suara');
    };

    const onFailure = (error) => {
      setConnectionStatus('DISCONNECTED');
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
      setConnectionStatus('CONNECTING');
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

  const isNoisy = parseFloat(soundData) > 70;
  const isTooDim = parseFloat(lightData) < 150;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDDC" />
      
      <View style={styles.mainGrid}>
        
        {/* HEADER BLOCK */}
        <View style={styles.headerBlock}>
          <Text style={styles.headline}>ENVIRONMENT</Text>
          <Text style={styles.headline}>APPARATUS</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, connectionStatus === 'CONNECTED' ? {backgroundColor: '#BA8530'} : {backgroundColor: '#802520'}]} />
            <Text style={styles.statusText}>SYS.{connectionStatus}</Text>
          </View>
        </View>

        {/* SENSOR CARDS ROW - 2 Columns */}
        <View style={styles.cardsRow}>
          
          {/* COLUMN 1: LIGHT SENSOR */}
          <View style={[styles.sensorCard, styles.sageBackground]}>
            <View style={styles.sensorHeader}>
              <Text style={styles.sensorTitle}>LUX</Text>
            </View>
            <View style={styles.dataWrapper}>
              <Text style={styles.dataValue}>{lightData}</Text>
            </View>
            <Text style={styles.sensorStatus}>
              {isTooDim ? 'DEFICIENT' : 'OPTIMAL'}
            </Text>
          </View>

          {/* COLUMN 2: SOUND SENSOR */}
          <View style={[styles.sensorCard, isNoisy ? styles.alertBackground : styles.sageBackground]}>
            <View style={styles.sensorHeader}>
              <Text style={styles.sensorTitle}>dB</Text>
            </View>
            <View style={styles.dataWrapper}>
              <Text style={styles.dataValue}>{soundData}</Text>
            </View>
            <Text style={styles.sensorStatus}>
              {isNoisy ? 'EXCESSIVE' : 'NOMINAL'}
            </Text>
          </View>
          
        </View>

        {/* FOOTER BLOCK */}
        <View style={styles.footerBlock}>
          <Text style={styles.footerText}>PROTOCOL: MQTT</Text>
          <Text style={styles.footerText}>NODE: ESP32</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDDC', 
  },
  mainGrid: {
    flex: 1,
    margin: 16,
    justifyContent: 'space-between',
  },
  headerBlock: {
    padding: 24,
    backgroundColor: '#F5EDDC',
    flex: 1,
    justifyContent: 'center',
  },
  headline: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 48,
    fontWeight: '900',
    color: '#181818',
    textTransform: 'uppercase',
    letterSpacing: -1,
    lineHeight: 48,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  statusText: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    color: '#181818',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cardsRow: {
    flexDirection: 'row',
    height: 250, 
    gap: 16, // Added gap to separate cards cleanly without borders
  },
  sensorCard: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  sageBackground: {
    backgroundColor: '#5C7F71', 
  },
  alertBackground: {
    backgroundColor: '#802520', 
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sensorTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 32,
    fontWeight: '900',
    color: '#F5EDDC',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dataWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 20,
  },
  dataValue: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 54,
    fontWeight: '900',
    color: '#F5EDDC',
    letterSpacing: -2,
  },
  sensorStatus: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 14,
    fontWeight: '800',
    color: '#F5EDDC',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerBlock: {
    padding: 20,
    backgroundColor: '#181818',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  footerText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#F5EDDC',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  }
});
