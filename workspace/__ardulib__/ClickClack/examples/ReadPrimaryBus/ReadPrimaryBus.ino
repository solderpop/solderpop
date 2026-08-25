// Scans the ClickClack primary I2C bus (sensors: TempSense, AirPress,
// LuxBoard, MotionSense) and reports which known ClickClack add-ons answer.
// ClickClack Spark (ESP32-C3) only — see ClickClack.h for board selection.

#include <ClickClack.h>
#include <Wire.h>

struct KnownDevice {
  uint8_t address;
  const char *name;
};

const KnownDevice knownDevices[] = {
  { CC_ADDR_LUXBOARD_VEML7700, "LuxBoard (VEML7700)" },
  { CC_ADDR_TEMPSENSE_SHT40, "TempSense (SHT40)" },
  { CC_ADDR_TEMPSENSE_SHT40B, "TempSense (SHT40-B)" },
  { CC_ADDR_MOTIONSENSE_LSM6DS3, "MotionSense (LSM6DS3)" },
  { CC_ADDR_AIRPRESS_BMP388, "AirPress (BMP388)" },
  { CC_ADDR_AIRPRESS_BMP388_ALT, "AirPress (BMP388, alt address)" },
};

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }

  Wire.begin(CC_SDA, CC_SCL);

  Serial.println("Scanning ClickClack primary bus...");
  for (const KnownDevice &device : knownDevices) {
    Wire.beginTransmission(device.address);
    if (Wire.endTransmission() == 0) {
      Serial.print("Found: ");
      Serial.println(device.name);
    }
  }
}

void loop() {
}
