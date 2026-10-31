// Curated project ideas for the Idea Machine (home page hero).
// Level: "mini" = 3rd-year B.Tech mini project, "major" = final-year major project.
// Most ideas use hardware (IoT / embedded / robotics): that is what we build best.
// The reels look random but always land on one of these, so every result
// is a real, buildable project. Edit freely — keep `title` short (fits a reel).
// `category` must match the submit form's category ids.
// `parts` are searched in the store (/store?q=...), so use common product names.

export type Branch = "CSE" | "IT" | "ECE" | "EEE" | "Mech";
export type Level = "mini" | "major";

export type Idea = {
  id: number;
  branches: Branch[];
  level: Level;
  domain: string;
  tech: string;
  title: string;
  pitch: string;
  category: "web" | "app" | "ml" | "iot" | "software";
  difficulty: 1 | 2 | 3 | 4 | 5;
  weeks: number;
  parts?: string[];
};

export const BRANCHES: Branch[] = ["CSE", "IT", "ECE", "EEE", "Mech"];

const SW: Branch[] = ["CSE", "IT"];

export const IDEAS: Idea[] = [
  // ─── CSE / IT · mini (3rd year) — mostly IoT + software depth ──
  { id: 1, branches: SW, level: "mini", domain: "Edge AI", tech: "ESP32-CAM", title: "Face-Unlock Smart Door", pitch: "Opens only for registered faces and keeps an entry log on a web dashboard.", category: "iot", difficulty: 4, weeks: 5, parts: ["ESP32-CAM", "Relay", "Solenoid lock"] },
  { id: 2, branches: SW, level: "mini", domain: "Security", tech: "Raspberry Pi", title: "IoT Honeypot Trap", pitch: "A fake smart camera that lures hackers on the network and records every attack.", category: "iot", difficulty: 4, weeks: 5, parts: ["Raspberry Pi"] },
  { id: 3, branches: SW, level: "mini", domain: "IoT", tech: "ESP32 + PIR", title: "Classroom Energy Saver", pitch: "Switches off lights and fans in empty classrooms and reports the savings.", category: "iot", difficulty: 3, weeks: 4, parts: ["ESP32", "PIR sensor", "Relay"] },
  { id: 4, branches: SW, level: "mini", domain: "Edge AI", tech: "Raspberry Pi", title: "Offline Voice Assistant", pitch: "A Jarvis-style assistant that answers questions and controls devices with no internet.", category: "iot", difficulty: 4, weeks: 5, parts: ["Raspberry Pi", "Microphone", "Relay"] },
  { id: 5, branches: SW, level: "mini", domain: "Edge AI", tech: "Pi + CNN", title: "Leaf Disease Scanner", pitch: "Point a camera at a leaf; an on-device model names the disease and the treatment.", category: "iot", difficulty: 4, weeks: 5, parts: ["Raspberry Pi", "Pi Camera"] },
  { id: 6, branches: SW, level: "mini", domain: "IoT", tech: "BLE Beacons", title: "BLE Auto Attendance", pitch: "Phones mark attendance automatically when students walk into the classroom.", category: "iot", difficulty: 3, weeks: 4, parts: ["ESP32"] },
  { id: 7, branches: SW, level: "mini", domain: "ML / AI", tech: "RAG + LLM", title: "Syllabus RAG Chatbot", pitch: "Ask questions about your semester PDFs and get answers that cite the exact page.", category: "ml", difficulty: 3, weeks: 4 },
  { id: 8, branches: SW, level: "mini", domain: "ML / AI", tech: "LLM", title: "Text-to-SQL Assistant", pitch: "Ask a database questions in plain English; it writes the SQL, runs it and charts the result.", category: "ml", difficulty: 3, weeks: 4 },

  // ─── CSE / IT · major (final year) — mostly IoT + AI ────────────
  { id: 11, branches: SW, level: "major", domain: "ML / AI", tech: "Federated + ESP32", title: "Federated Health Wearables", pitch: "Wearables train a shared health model without sending raw patient data anywhere.", category: "iot", difficulty: 5, weeks: 9, parts: ["ESP32", "MAX30102"] },
  { id: 12, branches: SW, level: "major", domain: "IoT", tech: "MQTT + 3D", title: "Smart City Digital Twin", pitch: "A live 3D city model fed by real traffic, air quality and street-light sensors.", category: "iot", difficulty: 5, weeks: 9, parts: ["ESP32", "MQ135", "IR sensor"] },
  { id: 13, branches: SW, level: "major", domain: "Blockchain", tech: "IoT + Solidity", title: "Blockchain Cold Chain", pitch: "Vaccine boxes log their temperature to a blockchain, so nobody can fake the records.", category: "iot", difficulty: 5, weeks: 9, parts: ["ESP32", "DS18B20", "GPS"] },
  { id: 14, branches: SW, level: "major", domain: "Edge AI", tech: "Pi + YOLO", title: "Edge AI Traffic Signal", pitch: "Counts vehicles at a junction with a camera and adjusts signal timing on its own.", category: "iot", difficulty: 5, weeks: 8, parts: ["Raspberry Pi", "Pi Camera"] },
  { id: 15, branches: SW, level: "major", domain: "Edge AI", tech: "TinyML + LoRa", title: "Wildlife Intrusion Alert", pitch: "Camera traps spot elephants near farms and alert villagers over LoRa.", category: "iot", difficulty: 5, weeks: 8, parts: ["ESP32-CAM", "LoRa"] },
  { id: 16, branches: SW, level: "major", domain: "IoT", tech: "RFID + Web", title: "Smart Billing Cart", pitch: "A trolley that bills items as you drop them in, so you skip the checkout queue.", category: "iot", difficulty: 4, weeks: 7, parts: ["ESP32", "RFID", "LCD"] },
  { id: 17, branches: SW, level: "major", domain: "Security", tech: "Pi + ML", title: "IoT Botnet Blocker", pitch: "Watches traffic from smart devices and blocks any that start acting like a botnet.", category: "iot", difficulty: 5, weeks: 8, parts: ["Raspberry Pi"] },
  { id: 18, branches: SW, level: "major", domain: "ML / AI", tech: "CNN-LSTM", title: "Deepfake Video Detector", pitch: "Spots manipulated faces in videos frame by frame and scores how likely it is fake.", category: "ml", difficulty: 5, weeks: 9 },
  { id: 19, branches: SW, level: "major", domain: "ML / AI", tech: "LLM Agents", title: "AI Research Agent", pitch: "Agents search papers, summarise them and draft a literature review with citations.", category: "ml", difficulty: 5, weeks: 8 },

  // ─── ECE · mini (3rd year) ──────────────────────────────────────
  { id: 30, branches: ["ECE"], level: "mini", domain: "Edge AI", tech: "TinyML", title: "Offline Voice Commands", pitch: "Recognises spoken commands on a ₹400 chip, with no internet or cloud.", category: "iot", difficulty: 4, weeks: 5, parts: ["ESP32", "Microphone"] },
  { id: 31, branches: ["ECE", "CSE"], level: "mini", domain: "IoT", tech: "ESP32-CAM", title: "ANPR Smart Parking", pitch: "Reads number plates at the gate and shows free parking slots live on an app.", category: "iot", difficulty: 4, weeks: 5, parts: ["ESP32-CAM", "IR sensor"] },
  { id: 32, branches: ["ECE"], level: "mini", domain: "Assistive", tech: "MPU6050", title: "Head-Gesture Wheelchair", pitch: "Steers a wheelchair model by tilting the head, for users who can't use their hands.", category: "iot", difficulty: 3, weeks: 4, parts: ["Arduino Uno", "MPU6050", "Motor driver"] },
  { id: 33, branches: ["ECE"], level: "mini", domain: "IoT", tech: "ESP32", title: "Elderly Fall Detector", pitch: "A wearable that detects a fall and sends the location to family instantly.", category: "iot", difficulty: 3, weeks: 4, parts: ["ESP32", "MPU6050", "GPS"] },
  { id: 34, branches: ["ECE"], level: "mini", domain: "RF", tech: "RTL-SDR", title: "SDR Spectrum Analyzer", pitch: "Scans radio bands and plots live signals on a waterfall display.", category: "software", difficulty: 4, weeks: 5, parts: ["RTL-SDR"] },
  { id: 35, branches: ["ECE"], level: "mini", domain: "Security", tech: "ESP32-CAM", title: "Two-Factor Smart Door", pitch: "The door opens only when the ID card and the face both match.", category: "iot", difficulty: 3, weeks: 4, parts: ["ESP32-CAM", "RFID"] },
  { id: 36, branches: ["ECE"], level: "mini", domain: "IoT", tech: "NodeMCU", title: "AQI Forecast Station", pitch: "Measures PM2.5 and gases, and forecasts the next six hours of air quality.", category: "iot", difficulty: 3, weeks: 4, parts: ["NodeMCU", "PMS5003", "MQ135"] },
  { id: 37, branches: ["ECE"], level: "mini", domain: "Wireless", tech: "ESP-Mesh", title: "ESP-Mesh Smart Lighting", pitch: "Lights talk to each other over a mesh, so one phone controls a whole building.", category: "iot", difficulty: 3, weeks: 4, parts: ["ESP32", "Relay"] },
  { id: 38, branches: ["ECE"], level: "mini", domain: "Biomedical", tech: "AD8232", title: "Portable ECG Monitor", pitch: "Records ECG on a phone app and flags irregular heartbeats.", category: "iot", difficulty: 4, weeks: 5, parts: ["AD8232", "ESP32"] },

  // ─── ECE · major (final year) ───────────────────────────────────
  { id: 40, branches: ["ECE"], level: "major", domain: "IoT", tech: "ESP32 + ML", title: "Crash-Detect Smart Helmet", pitch: "Tells a real crash from a dropped helmet with an on-device model, then sends GPS location.", category: "iot", difficulty: 4, weeks: 7, parts: ["ESP32", "MPU6050", "GPS", "GSM"] },
  { id: 41, branches: ["ECE"], level: "major", domain: "VLSI", tech: "FPGA", title: "FPGA Edge Detection", pitch: "Real-time edge detection on live camera video, written in Verilog on an FPGA.", category: "iot", difficulty: 5, weeks: 9, parts: ["FPGA"] },
  { id: 42, branches: ["ECE", "Mech"], level: "major", domain: "Robotics", tech: "ROS + LiDAR", title: "LiDAR SLAM Rover", pitch: "A rover that maps a room and plans its own path around obstacles.", category: "iot", difficulty: 5, weeks: 9, parts: ["Raspberry Pi", "LiDAR"] },
  { id: 43, branches: ["ECE"], level: "major", domain: "ML / AI", tech: "Pi + OpenCV", title: "Driver Drowsiness Alert", pitch: "Watches the driver's eyes and yawns, and alerts before they fall asleep.", category: "iot", difficulty: 4, weeks: 7, parts: ["Raspberry Pi", "Pi Camera", "Buzzer"] },
  { id: 44, branches: ["ECE"], level: "major", domain: "Wireless", tech: "LoRa", title: "LoRa Disaster Messenger", pitch: "Phones send SOS messages through a LoRa mesh when mobile networks are down.", category: "iot", difficulty: 5, weeks: 8, parts: ["LoRa", "ESP32"] },
  { id: 45, branches: ["ECE"], level: "major", domain: "Biomedical", tech: "ESP32 + Cloud", title: "Remote ICU Monitor", pitch: "Streams SpO2, pulse and temperature to a doctor's dashboard with smart alerts.", category: "iot", difficulty: 4, weeks: 7, parts: ["ESP32", "MAX30102", "DS18B20"] },
  { id: 46, branches: ["ECE", "CSE"], level: "major", domain: "Assistive", tech: "Pi + YOLO", title: "Vision Aid Smart Glasses", pitch: "Glasses that describe obstacles and read signboards aloud for visually impaired users.", category: "iot", difficulty: 5, weeks: 9, parts: ["Raspberry Pi", "Pi Camera"] },
  { id: 47, branches: ["ECE"], level: "major", domain: "Wireless", tech: "nRF24L01", title: "Vehicle-to-Vehicle Alerts", pitch: "Cars warn each other about sudden braking and vehicles in the blind spot.", category: "iot", difficulty: 4, weeks: 7, parts: ["Arduino Uno", "nRF24L01", "Ultrasonic"] },
  { id: 48, branches: ["ECE", "Mech"], level: "major", domain: "Biomedical", tech: "EMG + Servo", title: "EMG Prosthetic Hand", pitch: "A 3D-printed hand that moves using muscle signals from the forearm.", category: "iot", difficulty: 5, weeks: 9, parts: ["EMG sensor", "Servo", "Arduino Uno"] },
  { id: 49, branches: ["ECE", "CSE"], level: "major", domain: "IoT", tech: "GPS + GSM", title: "Fleet Tracking + Geofence", pitch: "Tracks college buses live and alerts when one leaves its route or overspeeds.", category: "iot", difficulty: 4, weeks: 7, parts: ["ESP32", "GPS", "GSM"] },

  // ─── EEE · mini (3rd year) ──────────────────────────────────────
  { id: 50, branches: ["EEE"], level: "mini", domain: "Power", tech: "Arduino", title: "MPPT Solar Charger", pitch: "Squeezes maximum power from a solar panel using the perturb-and-observe algorithm.", category: "iot", difficulty: 4, weeks: 5, parts: ["Arduino Uno", "ACS712", "Voltage sensor"] },
  { id: 51, branches: ["EEE"], level: "mini", domain: "Power", tech: "ESP32", title: "Power Theft Detector", pitch: "Compares pole and house meter readings to catch electricity theft.", category: "iot", difficulty: 3, weeks: 4, parts: ["ESP32", "ACS712"] },
  { id: 52, branches: ["EEE", "ECE"], level: "mini", domain: "IoT", tech: "ESP32", title: "IoT Energy Meter", pitch: "Shows live power use per appliance and predicts this month's bill.", category: "iot", difficulty: 3, weeks: 4, parts: ["ESP32", "ACS712"] },
  { id: 53, branches: ["EEE"], level: "mini", domain: "Control", tech: "PID", title: "PID BLDC Speed Control", pitch: "Holds a BLDC motor at the exact set speed under changing load with tuned PID.", category: "iot", difficulty: 3, weeks: 4, parts: ["Arduino Uno", "BLDC motor", "ESC"] },
  { id: 54, branches: ["EEE", "ECE"], level: "mini", domain: "Automation", tech: "ESP32", title: "Voice Home Automation", pitch: "Control lights and fans by voice through Alexa or Google, with usage stats.", category: "iot", difficulty: 2, weeks: 3, parts: ["ESP32", "Relay"] },
  { id: 55, branches: ["EEE"], level: "mini", domain: "Power", tech: "Arduino", title: "Line Fault Locator", pitch: "Finds the type of fault on a model transmission line and how far away it is.", category: "iot", difficulty: 3, weeks: 4, parts: ["Arduino Uno", "Relay", "LCD"] },

  // ─── EEE · major (final year) ───────────────────────────────────
  { id: 56, branches: ["EEE"], level: "major", domain: "Power", tech: "Kalman Filter", title: "EV BMS with SoC Estimation", pitch: "Battery management that estimates charge with a Kalman filter and balances every cell.", category: "iot", difficulty: 5, weeks: 9, parts: ["ESP32", "Voltage sensor", "ACS712"] },
  { id: 57, branches: ["EEE"], level: "major", domain: "Power", tech: "Inductive", title: "Wireless EV Charging", pitch: "Charges an EV model parked over a coil, with automatic alignment detection.", category: "iot", difficulty: 5, weeks: 8 },
  { id: 58, branches: ["EEE"], level: "major", domain: "Power", tech: "ESP32 + LSTM", title: "AI Load Forecast Meter", pitch: "Smart meters log feeder usage and an LSTM predicts tomorrow's demand.", category: "iot", difficulty: 4, weeks: 7, parts: ["ESP32", "ACS712"] },
  { id: 59, branches: ["EEE"], level: "major", domain: "Power", tech: "Arduino", title: "V2H Bidirectional Charger", pitch: "A charger model that powers the house from the EV battery during a power cut.", category: "iot", difficulty: 5, weeks: 8, parts: ["Arduino Uno", "Relay", "Voltage sensor"] },
  { id: 60, branches: ["EEE"], level: "major", domain: "Power", tech: "IoT + ML", title: "Transformer Fault AI", pitch: "Predicts transformer faults early from oil temperature, load and vibration trends.", category: "iot", difficulty: 4, weeks: 7, parts: ["ESP32", "DS18B20", "ACS712"] },
  { id: 61, branches: ["EEE"], level: "major", domain: "Power", tech: "Solar + Battery", title: "Solar Microgrid Controller", pitch: "Switches a microgrid between solar, battery and mains to cut cost automatically.", category: "iot", difficulty: 5, weeks: 8, parts: ["Arduino Uno", "Relay", "Voltage sensor"] },
  { id: 62, branches: ["EEE"], level: "major", domain: "Power", tech: "Arduino", title: "APFC Panel", pitch: "Measures power factor and switches capacitor banks automatically to correct it.", category: "iot", difficulty: 4, weeks: 7, parts: ["Arduino Uno", "Relay"] },

  // ─── Mech · mini (3rd year) ─────────────────────────────────────
  { id: 70, branches: ["Mech"], level: "mini", domain: "Robotics", tech: "PID + IR Array", title: "PID Line Follower Robot", pitch: "A fast line follower tuned with PID control, built for robotics competitions.", category: "iot", difficulty: 3, weeks: 3, parts: ["Arduino Uno", "IR sensor", "Motor driver"] },
  { id: 71, branches: ["Mech"], level: "mini", domain: "Monitoring", tech: "ESP32 + FFT", title: "Vibration Fault Predictor", pitch: "Listens to motor vibration and predicts bearing failure before it happens.", category: "iot", difficulty: 4, weeks: 5, parts: ["ESP32", "MPU6050"] },
  { id: 72, branches: ["Mech", "ECE"], level: "mini", domain: "Automation", tech: "OpenCV", title: "Vision Sorting Conveyor", pitch: "A conveyor that sorts parts by colour and shape using a camera.", category: "iot", difficulty: 4, weeks: 5, parts: ["Raspberry Pi", "Pi Camera", "Servo"] },
  { id: 73, branches: ["Mech"], level: "mini", domain: "Automation", tech: "Arduino", title: "Auto Emergency Braking", pitch: "A vehicle model that brakes by itself when an obstacle gets too close.", category: "iot", difficulty: 3, weeks: 4, parts: ["Arduino Uno", "Ultrasonic", "Servo"] },
  { id: 74, branches: ["Mech"], level: "mini", domain: "Robotics", tech: "Arduino", title: "Solar Panel Cleaner Bot", pitch: "Crawls across solar panels and cleans dust on a schedule, without water.", category: "iot", difficulty: 3, weeks: 4, parts: ["Arduino Uno", "Motor driver"] },
  { id: 75, branches: ["Mech"], level: "mini", domain: "Automation", tech: "GRBL", title: "Mini CNC Plotter", pitch: "Draws or engraves designs from a computer file using G-code.", category: "iot", difficulty: 3, weeks: 4, parts: ["Arduino Uno", "Stepper motor"] },
  { id: 76, branches: ["Mech", "EEE"], level: "mini", domain: "Power", tech: "Arduino", title: "Regen Braking Bicycle", pitch: "Recovers energy every time you brake and stores it in a battery.", category: "iot", difficulty: 3, weeks: 4, parts: ["Arduino Uno", "Voltage sensor"] },

  // ─── Mech · major (final year) ──────────────────────────────────
  { id: 77, branches: ["Mech", "ECE"], level: "major", domain: "Robotics", tech: "ROS + OpenCV", title: "Vision Pick-and-Place Arm", pitch: "A robot arm that finds objects with a camera and picks them up on its own.", category: "iot", difficulty: 5, weeks: 9, parts: ["Raspberry Pi", "Servo", "Pi Camera"] },
  { id: 78, branches: ["Mech"], level: "major", domain: "Biomech", tech: "EMG + Servo", title: "Knee Assist Exoskeleton", pitch: "A powered knee brace that helps patients walk, driven by muscle signals.", category: "iot", difficulty: 5, weeks: 9, parts: ["EMG sensor", "Servo"] },
  { id: 79, branches: ["Mech", "ECE"], level: "major", domain: "Robotics", tech: "Pixhawk", title: "Crop Spraying Drone", pitch: "A drone that flies a planned path over a field and sprays crops evenly.", category: "iot", difficulty: 5, weeks: 9, parts: ["Drone kit"] },
  { id: 80, branches: ["Mech"], level: "major", domain: "Industry 4.0", tech: "IoT + 3D", title: "Machine Digital Twin", pitch: "A live 3D model on screen that mirrors a real motor's speed, heat and faults.", category: "iot", difficulty: 5, weeks: 8, parts: ["ESP32", "MPU6050", "DS18B20"] },
  { id: 81, branches: ["Mech", "ECE"], level: "major", domain: "Robotics", tech: "ESP32 + Thermal", title: "Autonomous Fire Robot", pitch: "Finds a fire with a thermal sensor and puts it out without a driver.", category: "iot", difficulty: 4, weeks: 7, parts: ["ESP32", "Flame sensor", "Water pump"] },
  { id: 82, branches: ["Mech"], level: "major", domain: "Control", tech: "PID", title: "Active Suspension System", pitch: "A car suspension model that adjusts itself to keep the body level over bumps.", category: "iot", difficulty: 5, weeks: 8 },
  { id: 83, branches: ["Mech", "ECE"], level: "major", domain: "Robotics", tech: "RFID + Line", title: "Warehouse AGV Robot", pitch: "A self-driving cart that carries goods between racks using RFID checkpoints.", category: "iot", difficulty: 4, weeks: 7, parts: ["Arduino Uno", "RFID", "Motor driver"] },
];

export function ideasFor(branch: Branch, level: Level) {
  return IDEAS.filter((i) => i.level === level && i.branches.includes(branch));
}

// Next idea for a spin: never the current one, and avoids recently
// seen ideas while fresh ones remain.
export function pickNext(pool: Idea[], current: Idea, recent: number[], rand = Math.random): Idea | null {
  const others = pool.filter((i) => i.id !== current.id);
  if (others.length === 0) return null;
  const fresh = others.filter((i) => !recent.includes(i.id));
  const from = fresh.length ? fresh : others;
  return from[Math.floor(rand() * from.length)];
}
