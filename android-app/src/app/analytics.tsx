import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, Platform, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from 'expo-router';

// Ganti URL dan Kunci di bawah ini jika diperlukan (saat ini menggunakan yang ada di backend/.env)
const SUPABASE_URL = 'https://vbjukutqhdlbutzypwqo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QLbjmLTcdLhz260_9TnhdA_p-ynePJg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const screenWidth = Dimensions.get("window").width;

export default function Analytics() {
  const [logData, setLogData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    const { data, error } = await supabase
      .from('sensor_logs')
      .select('*')
      .order('id', { ascending: false })
      .limit(10); // Fetch the last 10 records for the graph

    if (error) {
      console.error("Error fetching logs:", error);
    } else if (data) {
      // Reverse to chronological order for graph (left to right)
      setLogData(data.reverse());
    }
    if (isInitial) setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
      const intervalId = setInterval(() => fetchData(false), 5000); // Polling silent (tanpa loading screen)
      return () => clearInterval(intervalId);
    }, [])
  );

  const luxValues = logData.map(log => log.light_lux);
  const dbValues = logData.map(log => log.sound_db);
  const labels = logData.map(log => {
    const d = new Date(log.created_at);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  const chartConfig = {
    backgroundGradientFrom: "#F5EDDC",
    backgroundGradientTo: "#F5EDDC",
    color: (opacity = 1) => `rgba(24, 24, 24, ${opacity})`, // Near Black
    strokeWidth: 4, 
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0, // Mengurangi digit desimal agar label Y-Axis tidak kepotong
    propsForDots: {
      r: "0", // Hilangkan lengkungan dot bundar agar kaku
    },
    propsForBackgroundLines: {
      strokeDasharray: "", // Solid lines
      stroke: "#181818",
      strokeWidth: 2,
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDDC" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBlock}>
          <Text style={styles.headline}>ANALYTICS</Text>
          <Text style={styles.subhead}>HISTORICAL DATA (SUPABASE)</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#802520" />
          </View>
        ) : logData.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.subhead}>NO DATA FOUND</Text>
          </View>
        ) : (
          <View style={styles.graphsContainer}>
            
            {/* LUX GRAPH */}
            <View style={styles.graphBlock}>
              <View style={[styles.graphTitleBox, {backgroundColor: '#5C7F71'}]}>
                <Text style={styles.graphTitle}>ILLUMINATION (LUX)</Text>
              </View>
              <LineChart
                data={{
                  labels: labels,
                  datasets: [{ data: luxValues }]
                }}
                width={screenWidth - 32}
                height={220}
                formatYLabel={(yValue) => ` ${yValue}`} // Menambah spasi agar chart-kit melebarkan area Y-Axis
                chartConfig={chartConfig}
                bezier={false} // Wajib false untuk strict lines (Bauhaus)
                withInnerLines={true}
                withOuterLines={true}
                style={styles.chartStyle}
              />
            </View>

            {/* DB GRAPH */}
            <View style={styles.graphBlock}>
              <View style={[styles.graphTitleBox, {backgroundColor: '#802520'}]}>
                <Text style={styles.graphTitle}>NOISE LEVEL (dB)</Text>
              </View>
              <LineChart
                data={{
                  labels: labels,
                  datasets: [{ data: dbValues }]
                }}
                width={screenWidth - 32}
                height={220}
                formatYLabel={(yValue) => ` ${yValue}`} // Menambah spasi agar chart-kit melebarkan area Y-Axis
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(128, 37, 32, ${opacity})`, // Oxide Red
                }}
                bezier={false}
                withInnerLines={true}
                withOuterLines={true}
                style={styles.chartStyle}
              />
            </View>

          </View>
        )}
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
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphsContainer: {
    gap: 32,
  },
  graphBlock: {
    backgroundColor: '#F5EDDC',
  },
  graphTitleBox: {
    padding: 12,
    borderBottomWidth: 6,
    borderBottomColor: '#181818',
  },
  graphTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 20,
    fontWeight: '900',
    color: '#F5EDDC',
    letterSpacing: 1,
  },
  chartStyle: {
    marginVertical: 8,
    paddingRight: 32, // Menambahkan padding kanan agar grafik proporsional di layar
  }
});
