#include <BH1750.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <math.h> // Diperlukan untuk perhitungan logaritma dB

// --- Kredensial WiFi ---
const char *ssid = "PIPIN";
const char *password = "galangfina00";

// --- Kredensial HiveMQ Cloud ---
const char *mqtt_server = "1cedb0438eb245fd95ead5a0b1984f21.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char *mqtt_user = "esp32-mc";
const char *mqtt_pass = "esp32-mc-L";

// --- Topik MQTT ---
const char *topic_cahaya = "kelas/monitoring/cahaya";
const char *topic_suara = "kelas/monitoring/suara";

// --- Inisialisasi Klien ---
WiFiClientSecure espClient;
PubSubClient client(espClient);

// --- Inisialisasi Sensor ---
BH1750 lightMeter;
const int soundSensorPin = 34; // Pastikan tetap di pin ADC (contoh: 34, 35, 32)

unsigned long lastMsg = 0;
const long interval = 5000;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0, 1000));

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setupSensors() {
  Wire.begin();
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("BH1750 Advanced begin");
  } else {
    Serial.println("Error initialising BH1750");
  }

  pinMode(soundSensorPin, INPUT);
}

float readLightSensor() { return lightMeter.readLightLevel(); }

// Fungsi baru untuk membaca dB secara lebih akurat
float readSoundSensor() {
  unsigned long startMillis = millis();
  int signalMax = 0;
  int signalMin = 4095;
  const int sampleWindow = 50; // Ambil sampel selama 50 milidetik

  // Kumpulkan data selama 50ms untuk mencari puncak gelombang suara
  while (millis() - startMillis < sampleWindow) {
    int sample = analogRead(soundSensorPin);
    if (sample < 4095) {
      if (sample > signalMax) {
        signalMax = sample;
      }
      if (sample < signalMin) {
        signalMin = sample;
      }
    }
  }

  // Hitung selisih amplitudo tertinggi dan terendah
  int peakToPeak = signalMax - signalMin;

  // Ubah nilai mentah menjadi tegangan listrik (Volt)
  float voltage = (peakToPeak * 3.3) / 4095.0;

  // Konversi tegangan ke desibel (dB)
  float dbValue = 0;
  if (voltage > 0.01) {
    // Rumus pendekatan logaritma agar skalanya menyerupai alat ukur SPL
    dbValue = 20.0 * log10(voltage / 0.005);
  } else {
    // Nilai standar jika ruangan tidak ada suara sama sekali
    dbValue = 30.0;
  }

  // Batasi rentang nilai agar tetap masuk akal
  if (dbValue < 30.0)
    dbValue = 30.0;
  if (dbValue > 120.0)
    dbValue = 120.0;

  return dbValue;
}

void setup() {
  Serial.begin(115200);
  setup_wifi();

  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);

  setupSensors();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    // Membaca data riil dari sensor
    float realLight = readLightSensor();
    float realSoundDB = readSoundSensor();

    String lightString = String(realLight);
    String soundString = String(realSoundDB);

    Serial.print("Publish message: ");
    Serial.print(lightString);
    Serial.print(" Lux, ");
    Serial.print(soundString);
    Serial.println(" dB");

    client.publish(topic_cahaya, lightString.c_str());
    client.publish(topic_suara, soundString.c_str());
  }
}