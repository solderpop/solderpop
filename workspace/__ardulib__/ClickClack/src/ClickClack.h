#pragma once

// ClickClack — named pin and I2C address constants for SolderPop ClickClack
// boards. Include this header instead of the board-specific ones directly.
//
// Board is selected via the Arduino board menu, not a library option:
//   - ClickClack Spark   -> select "ESP32C3 Dev Module" (esp32:esp32:esp32c3),
//                           4MB flash, "CDC on Boot: Enabled".
//   - ClickClack Horizon -> select "Adafruit Feather nRF52840 Express"
//                           (adafruit:nrf52:feather52840). Pin map not yet
//                           implemented, see ClickClack_Horizon.h.
//
// Source of truth for all constants: the ClickClack-hardware repo,
// docs/ClickClack_Pin_Allocation.ods.

#include "ClickClackAddresses.h"

#if defined(ARDUINO_ESP32C3_DEV)
  #include "ClickClack_Spark.h"
#elif defined(ARDUINO_NRF52840_FEATHER)
  #include "ClickClack_Horizon.h"
#else
  #error "ClickClack: unrecognized board. Select 'ESP32C3 Dev Module' for ClickClack Spark, or 'Adafruit Feather nRF52840 Express' for ClickClack Horizon (see ClickClack.h)."
#endif
