#pragma once

// ClickClack Horizon (nRF52840) pin map — NOT YET IMPLEMENTED.
//
// The nRF52840 column of ClickClack_Pin_Allocation.ods ("Connector Spec v3"
// sheet) is almost entirely unfilled placeholder text ("P0.xx"), and the few
// cells that do have a real pin number contain a contradiction: connector
// pins 15/17 (UART_TX/RX) and pins 30/28 (UART_TX_ALT/RX_ALT) are both
// listed as P0.08/P0.06 — the same physical pins reused for what the "Bus
// Summary" sheet describes as a *second*, independent UART peripheral
// (UARTE1). That can't be right as written.
//
// Separately, Arduino pin numbers on the nRF52840 Adafruit core are an
// index into a per-variant pin table (g_ADigitalPinMap), not the chip's
// physical P0.xx/P1.xx port-pin number. Horizon is a custom PCB, not a
// stock Adafruit Feather nRF52840 Express, so even a fully-specified P0.xx
// map cannot be safely turned into Arduino pin numbers without a real
// Horizon-specific variant (variant.cpp / pins_arduino.h) — reusing the
// Feather's table would silently point at the wrong physical pins.
//
// Shipping guessed values here would look correct and fail on real
// hardware. Needs, before this can be filled in:
//   1. ClickClack_Pin_Allocation.ods "Connector Spec v3" nRF column
//      finished and the UART/ALT-UART duplicate resolved.
//   2. A Horizon-specific Arduino variant (own g_ADigitalPinMap), not the
//      stock Feather nRF52840 Express variant.
//
// Tracked in docs/branch-changelist.md.

#error "ClickClack: Horizon (nRF52840) pin map is not finalized yet — see comment in ClickClack_Horizon.h. Only ClickClack Spark (ESP32-C3) is currently supported."
