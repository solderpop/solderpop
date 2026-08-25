#pragma once

// ClickClack I2C address map — board-agnostic (same on Spark and Horizon).
//
// Source of truth: clickclack-hardware/docs/ClickClack_Pin_Allocation.ods,
// "Master I2C Address Map" sheet. Keep this file in sync with that document.
//
// Sensor add-on boards live on the primary bus (CC_SDA/CC_SCL). Power ICs
// (fuel gauge, charger) live on the secondary bus (CC_SDA2/CC_SCL2 on Spark)
// specifically so they never collide with a sensor at the same address.

// --- Primary bus (sensors) ---
#define CC_ADDR_LUXBOARD_VEML7700        0x10  // ambient light. No addr-select pin: max 1 per stack.
#define CC_ADDR_TEMPSENSE_SHT40          0x44  // default part.
#define CC_ADDR_TEMPSENSE_SHT40B         0x45  // SHT40-B variant.
#define CC_ADDR_MOTIONSENSE_LSM6DS3      0x6A  // SA0 low (default).
#define CC_ADDR_MOTIONSENSE_LSM6DS3_ALT  0x6B  // SA0 high — only if a second MotionSense is on the bus. NOTE: also collides with CC_ADDR_CHARGER_BQ25188; do not use both on the same bus.
#define CC_ADDR_AIRPRESS_BMP388          0x76  // SDO low (default).
#define CC_ADDR_AIRPRESS_BMP388_ALT      0x77  // SDO high — for a second AirPress.

// --- Secondary bus (power ICs — keep isolated from sensor bus) ---
#define CC_ADDR_GAUGE_MAX1705X           0x36  // MAX17055 (Horizon) or MAX17048 (Spark alt) fuel gauge. Never both present.
#define CC_ADDR_CHARGER_BQ25188          0x6B  // Horizon charger. Fixed address, must stay off the primary/sensor bus.

// --- Spark-only alternate gauge options (pick at most one) ---
#define CC_ADDR_GAUGE_LC709203F_SPARK    0x0B
#define CC_ADDR_GAUGE_CW2015_SPARK       0x62

// --- Reserved, not yet in use ---
// 0x50-0x57 — reserved for optional 24Cxx board-ID EEPROMs (passive-board
// detection), not assigned to a real part yet.

// --- Not addressable on I2C — do not bus-scan for these ---
// SoundSnap (PDM/I2S mic), GPSTrack (UART), LoRaLink (SPI), RGBStrip
// (WS2812/GPIO), SoilProbe (ADC), SolarCharge/Battery-Pack (passive power),
// BQ24040 Spark charger (no I2C) all need to be added manually in the IDE.
