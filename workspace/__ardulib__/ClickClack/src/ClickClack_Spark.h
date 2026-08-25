#pragma once

// ClickClack Spark (ESP32-C3) pin map.
//
// Source of truth: clickclack-hardware/docs/ClickClack_Pin_Allocation.ods,
// "Connector Spec v3" sheet (the "Recommended Pin Spec v2" and "34-Pin
// Connector Map" sheets are superseded by v3 — do not cross-reference them).
// Keep this file in sync with that document.
//
// Only signals with sheet status "ASSIGNED" and an unambiguous single GPIO
// number are defined below. Comments give the connector pin number (J3/J4
// position, 1-34), not the GPIO number, for cross-referencing the sheet.
//
// KNOWN SPEC ISSUES (as of this writing — fix in the spreadsheet, not here):
//  - Connector pin 8 (GPIO_B, status "Reserved") is also listed as GPIO5,
//    which collides with pin 13 (GPIO_A/LED, status "ASSIGNED", also GPIO5).
//    Pin 8 is intentionally left undefined below until resolved.
//  - Connector pin 4 (SPI_CS1 -> GPIO3) collides with pin 10 (AIN1 -> GPIO3).
//  - Connector pin 6 (SPI_CS2 -> GPIO10) collides with pin 26 (SDA2 -> GPIO10).
//    Both CS pins are status "Reserved" (not finalized) and are left
//    undefined below to avoid encoding a guess.
//  - Connector pins 14/16/18 (SPI COPI/SCK/CS0) have a chosen *strategy*
//    (software/bit-banged SPI, since the ESP32-C3's hardware SPI pins are
//    used internally for flash) but no chosen GPIO numbers yet. Left
//    undefined below — do not guess free pins, several "free" candidates
//    mentioned in the "SPI Problem Analysis" sheet actually collide with
//    pins already assigned here (e.g. GPIO0, GPIO5, GPIO6, GPIO7).
//
// Undefined-until-resolved signals (documented for completeness, no macro):
//   CC_SPI_CS1 (pin 4), CC_SPI_CS2 (pin 6), CC_GPIO_B (pin 8),
//   CC_AIN1 (pin 10), CC_I2S_CLK (pin 12), CC_SPI_COPI (pin 14),
//   CC_SPI_SCK (pin 16), CC_SPI_CS0 (pin 18), CC_VBAT_SENSE (pin 27).

// --- I2C primary bus — sensors (TempSense, AirPress, LuxBoard, MotionSense) ---
#define CC_SDA            1   // connector pin 7
#define CC_SCL            2   // connector pin 9, 400kHz fast mode default

// --- I2C secondary bus — power ICs (fuel gauge, charger), kept off the sensor bus ---
#define CC_SDA2           10  // connector pin 26
#define CC_SCL2           9   // connector pin 24

// --- Analog ---
#define CC_AIN0           0   // connector pin 5 — ADC0 (e.g. SoilProbe). RTC-wake capable in deep sleep.

// --- Interrupt ---
#define CC_INT            4   // connector pin 11 — shared open-drain interrupt (wire-AND across all add-ons), active low

// --- GPIO ---
#define CC_GPIO_A_LED     5   // connector pin 13 — WS2812/addressable LED data, PWM, or general GPIO
#define CC_GPIO8_BOOT     8   // connector pin 19 — ESP32-C3 boot strapping pin; avoid driving low at reset

// --- UART ---
#define CC_UART_TX        6   // connector pin 15 — e.g. GPS
#define CC_UART_RX        7   // connector pin 17
#define CC_UART_TX_ALT    21  // connector pin 30 — second serial device
#define CC_UART_RX_ALT    20  // connector pin 28
