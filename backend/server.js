require('dotenv').config();
const mqtt = require('mqtt');
const { createClient } = require('@supabase/supabase-js');

// --- Supabase Config ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: SUPABASE_URL atau SUPABASE_ANON_KEY belum diisi di file .env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- MQTT Config ---
const mqttServer = "mqtts://1cedb0438eb245fd95ead5a0b1984f21.s1.eu.hivemq.cloud:8883";
const mqttOptions = {
  clientId: `BackendServer-${Math.random().toString(16).substr(2, 8)}`,
  username: "esp32-mc",
  password: "esp32-mc-L",
  rejectUnauthorized: false // Memudahkan koneksi SSL ke HiveMQ tanpa sertifikat lokal
};

const client = mqtt.connect(mqttServer, mqttOptions);

const topicCahaya = "kelas/monitoring/cahaya";
const topicSuara = "kelas/monitoring/suara";

// Variabel penampung sementara karena sensor cahaya & suara datang terpisah
let tempCache = {
  light_lux: null,
  sound_db: null,
  lastUpdated: Date.now()
};

client.on('connect', () => {
  console.log("✅ Berhasil terhubung ke HiveMQ Cloud!");
  client.subscribe(topicCahaya);
  client.subscribe(topicSuara);
  console.log(`📡 Menunggu data dari topik: \n- ${topicCahaya}\n- ${topicSuara}`);
});

client.on('message', async (topic, message) => {
  const payload = parseFloat(message.toString());
  console.log(`Menerima pesan di [${topic}] -> ${payload}`);

  const now = Date.now();
  // Jika selisih penerimaan data antar sensor terlalu lama (misal beda loop), reset cache
  if (now - tempCache.lastUpdated > 3000) {
    tempCache.light_lux = null;
    tempCache.sound_db = null;
  }
  tempCache.lastUpdated = now;

  // Masukkan ke cache
  if (topic === topicCahaya) {
    tempCache.light_lux = payload;
  } else if (topic === topicSuara) {
    tempCache.sound_db = payload;
  }

  // Jika kedua data sudah lengkap, masukkan ke Supabase
  if (tempCache.light_lux !== null && tempCache.sound_db !== null) {
    console.log("💾 Menyimpan ke Supabase...");
    
    const { data, error } = await supabase
      .from('sensor_logs')
      .insert([
        { light_lux: tempCache.light_lux, sound_db: tempCache.sound_db }
      ]);

    if (error) {
      console.error("❌ Gagal menyimpan ke Supabase:", error.message);
    } else {
      console.log(`✅ Berhasil tersimpan: LUX=${tempCache.light_lux}, DB=${tempCache.sound_db}`);
    }

    // Reset cache setelah disimpan
    tempCache.light_lux = null;
    tempCache.sound_db = null;
  }
});

client.on('error', (err) => {
  console.error("❌ Koneksi MQTT Error:", err);
});
