import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, Platform, ScrollView } from 'react-native';

export default function Dossier() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDDC" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBlock}>
          <Text style={styles.headline}>DOSSIER</Text>
          <Text style={styles.subhead}>THEORETICAL CONTEXT</Text>
        </View>

        {/* LUX EXPLANATION */}
        <View style={styles.infoBlock}>
          <View style={[styles.infoTitleBox, {backgroundColor: '#5C7F71'}]}>
            <Text style={styles.infoTitle}>LUX (ILLUMINATION)</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              Lux is the measure of illuminance. It describes the total luminous flux incident on a surface. In the context of a classroom:
            </Text>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLeft}>{'< 150 Lux'}</Text>
              <Text style={styles.tableColRight}>DEFICIENT. Causes eye strain and reduces focus.</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLeft}>300 - 500 Lux</Text>
              <Text style={styles.tableColRight}>OPTIMAL. Standard requirement for reading and writing.</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLeft}>{'> 500 Lux'}</Text>
              <Text style={styles.tableColRight}>EXCESSIVE. May cause glare fatigue.</Text>
            </View>
          </View>
        </View>

        {/* DB EXPLANATION */}
        <View style={styles.infoBlock}>
          <View style={[styles.infoTitleBox, {backgroundColor: '#802520'}]}>
            <Text style={styles.infoTitle}>dB (NOISE LEVEL)</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              Decibel (dB) is a logarithmic unit used to express the ratio of sound pressure. In a learning environment:
            </Text>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLeft}>{'< 35 dB'}</Text>
              <Text style={styles.tableColRight}>EXCELLENT. Quiet library conditions. Perfect for exams.</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLeft}>35 - 50 dB</Text>
              <Text style={styles.tableColRight}>NOMINAL. Normal ambient background noise.</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLeft}>{'> 70 dB'}</Text>
              <Text style={styles.tableColRight}>DISRUPTIVE. Equivalent to traffic. Causes cognitive strain.</Text>
            </View>
          </View>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDDC', 
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBlock: {
    paddingVertical: 24,
    marginBottom: 24,
  },
  headline: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 48,
    fontWeight: '900',
    color: '#181818',
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  subhead: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    color: '#181818',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },
  infoBlock: {
    backgroundColor: '#F5EDDC',
    marginBottom: 32,
  },
  infoTitleBox: {
    padding: 12,
    borderBottomWidth: 6,
    borderBottomColor: '#181818',
  },
  infoTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 24,
    fontWeight: '900',
    color: '#F5EDDC',
    letterSpacing: 1,
  },
  infoContent: {
    padding: 16,
  },
  infoText: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 16,
    fontWeight: '500',
    color: '#181818',
    lineHeight: 24,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderColor: '#181818',
    paddingVertical: 12,
  },
  tableColLeft: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 16,
    fontWeight: '900',
    color: '#181818',
  },
  tableColRight: {
    flex: 2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 14,
    fontWeight: '500',
    color: '#181818',
    lineHeight: 20,
  }
});
