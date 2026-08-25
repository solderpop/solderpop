# ClickClack

Named pin and I2C address constants for SolderPop ClickClack boards, so sketches
and native node implementations can refer to `CC_SDA`, `CC_ADDR_TEMPSENSE_SHT40`,
etc. instead of raw GPIO numbers and magic hex addresses.

Source of truth for every constant in this library is the ClickClack-hardware
repo's `docs/ClickClack_Pin_Allocation.ods` ("Connector Spec v3" sheet for
pins, "Master I2C Address Map" sheet for addresses). If that document changes,
update this library to match — don't let them drift.

## Board support

| Board | Status |
|---|---|
| ClickClack Spark (ESP32-C3) | Pin map implemented. Select "ESP32C3 Dev Module", 4MB flash, "CDC on Boot: Enabled". |
| ClickClack Horizon (nRF52840) | Not implemented — see `src/ClickClack_Horizon.h` for why. |

## Known spec gaps (fix in the spreadsheet, then here)

- Connector pin 8 (`GPIO_B`) and pin 13 (`GPIO_A/LED`) both list GPIO5 on
  Spark. Pin 8 is left undefined until resolved.
- Connector pin 4 (`SPI_CS1`) and pin 10 (`AIN1`) both list GPIO3; pin 6
  (`SPI_CS2`) and pin 26 (`SDA2`) both list GPIO10. Both CS pins are still
  status "Reserved" and are left undefined.
- Software-SPI pins (connector pins 14/16/18) have a chosen strategy
  (bit-banged, since hardware SPI is used internally for flash on the C3)
  but no chosen GPIO numbers yet.
- The nRF52840 (Horizon) column is almost entirely unfilled placeholder
  text, and where filled, the primary UART (pins 15/17) and "second UART"
  (pins 30/28) list the same physical pins — contradicts the two-UART
  intent described in the "Bus Summary" sheet.

## Board manager note

This library does not install a custom "ClickClack" entry in the Arduino
Boards Manager — that would require forking Espressif's `esp32` and
Adafruit's `nRF52` platform packages (large, ongoing maintenance burden).
Instead it targets the existing upstream boards ("ESP32C3 Dev Module",
"Adafruit Feather nRF52840 Express") and gives them ClickClack-specific pin
names. See `docs/branch-changelist.md` in the SolderPop IDE repo for the
full reasoning and what a real custom platform would take.
