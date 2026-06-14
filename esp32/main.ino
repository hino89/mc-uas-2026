#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <BH1750.h> // Library untuk BH1750 (Cahaya)

// --- Kredensial WiFi ---
const char* ssid = "PIPIN";
const char* password = "galangfina00";

// --- Kredensial HiveMQ Cloud ---
const char* mqtt_server = "1cedb0438eb245fd95ead5a0b1984f21.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "esp32-mc";
const char* mqtt_pass = "esp32-mc-L";

// --- Topik MQTT ---
const char* topic_cahaya = "kelas/monitoring/cahaya";
const char* topic_suara = "kelas/monitoring/suara";

// --- Inisialisasi Klien ---
WiFiClientSecure espClient;
PubSubClient client(espClient);

// --- Inisialisasi Sensor ---
BH1750 lightMeter;
const int soundSensorPin = 34; // Pin analog untuk GY-MX4466 (contoh pin 34)

// Variabel untuk interval pengiriman data dummy
unsigned long lastMsg = 0;
const long interval = 5000; // Kirim data setiap 5 detik

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
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop hingga terkoneksi kembali ke MQTT
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0, 1000));
    
    // Connect menggunakan kredensial (clientId, username, password)
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      // Jika ingin subscribe topik, lakukan di sini
      // client.subscribe("topik/lain");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// ==========================================
// FUNGSI SENSOR (Belum dipanggil di loop utama)
// ==========================================

void setupSensors() {
  // Setup Sensor Cahaya BH1750
  Wire.begin();
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println(F("BH1750 Advanced begin"));
  } else {
    Serial.println(F("Error initialising BH1750"));
  }
  
  // Setup Sensor Suara GY-MX4466
  pinMode(soundSensorPin, INPUT);
}

float readLightSensor() {
  // Membaca intensitas cahaya dalam Lux
  float lux = lightMeter.readLightLevel();
  return lux;
}

int readSoundSensor() {
  // Membaca nilai analog dari modul mikrofon
  // GY-MX4466 menghasilkan tegangan analog bervariasi dengan suara
  int soundValue = analogRead(soundSensorPin);
  // (Opsional) Lakukan pengolahan sinyal seperti Peak-to-Peak di sini
  return soundValue;
}

// ==========================================

void setup() {
  Serial.begin(115200);
  
  // Setup WiFi dan MQTT
  setup_wifi();
  
  // Menggunakan mode insecure agar tidak perlu memvalidasi sertifikat TLS Root (untuk kemudahan testing)
  espClient.setInsecure(); 
  
  client.setServer(mqtt_server, mqtt_port);
  
  // Memanggil setup sensor (komentar jika belum dihubungkan fisik)
  // setupSensors(); 
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;
    
    // --- Data Dummy ---
    // Karena sensor belum ada, kita menggunakan data dummy menggunakan nilai random
    float dummyLight = random(100, 500) + (random(0, 100) / 100.0); // 100 - 500 Lux
    int dummySound = random(30, 80); // 30 - 80 dB (asumsi sederhana)

    // Jika sensor sudah siap, ganti dengan memanggil fungsi:
    // float realLight = readLightSensor();
    // int realSound = readSoundSensor();

    // Format menjadi string
    String lightString = String(dummyLight);
    String soundString = String(dummySound);

    // Publikasi ke broker MQTT
    Serial.print("Publish message: ");
    Serial.print(lightString);
    Serial.print(" Lux, ");
    Serial.print(soundString);
    Serial.println(" dB");

    client.publish(topic_cahaya, lightString.c_str());
    client.publish(topic_suara, soundString.c_str());
  }
}
