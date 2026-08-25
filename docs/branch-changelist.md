# Branch changelist — feature/general-improvements

Running log of every change made on this branch, kept so the work can be
split into smaller PRs later. Newest entries on top. Each entry: what
changed, why, and which "tier" it maps to from the initial codebase-review
pass (tier 1 = ClickClack hardware differentiation, tier 2 = quick UX wins,
tier 3 = branding/dep cleanup).

## 2026-08-25 — ClickClack pin-mapping Arduino library (tier 1, item 1)

**Files:**
- `workspace/__ardulib__/ClickClack/` (new) — `library.properties`,
  `keywords.txt`, `README.md`, `src/ClickClack.h`,
  `src/ClickClack_Spark.h`, `src/ClickClack_Horizon.h`,
  `src/ClickClackAddresses.h`, `examples/ReadPrimaryBus/ReadPrimaryBus.ino`
- `workspace/__ardulib__/README.md` — added ClickClack to the library index

**What:** Named pin constants (`CC_SDA`, `CC_SCL`, `CC_INT`, etc.) and I2C
address constants (`CC_ADDR_TEMPSENSE_SHT40`, etc.) for ClickClack boards,
sourced from `clickclack-hardware/docs/ClickClack_Pin_Allocation.ods`
("Connector Spec v3" and "Master I2C Address Map" sheets).

**Scope actually shipped vs. original tier-1 ask:** the original review
recommendation was "add a ClickClack board manifest (`package_index.json` +
`boards.txt`/`platform.txt`)" so ClickClack shows up as a selectable board in
Arduino Boards Manager. On investigation that requires forking Espressif's
`esp32` platform and Adafruit's `nRF52` platform (each is hundreds to tens
of thousands of lines of build recipes/toolchain config, actively
maintained upstream) — a real, ongoing engineering commitment, not a
self-contained change, and getting a build recipe wrong silently breaks
compiles for every user. Reframed (confirmed with user) to: target the
existing upstream boards ("ESP32C3 Dev Module" for Spark, "Adafruit Feather
nRF52840 Express" for Horizon) and ship the pin-naming layer instead.

**Spark (ESP32-C3): fully implemented.** ESP32 Arduino core GPIO numbers are
chip-level, not devkit-numbering-scheme dependent, so this is safe on real
hardware regardless of which ESP32-C3 devkit entry is selected.

**Horizon (nRF52840): intentionally NOT implemented.** Two independent
blockers, documented in `src/ClickClack_Horizon.h`:
1. The source spreadsheet's nRF52840 column is almost entirely unfilled
   placeholder text, and where filled, contains a real contradiction
   (primary UART and "alt/second UART" both listed on the same physical
   pins P0.06/P0.08).
2. Even a complete P0.xx map couldn't safely become Arduino pin numbers via
   the stock "Adafruit Feather nRF52840 Express" variant, because nRF52
   Arduino pin numbers index into a per-board pin table
   (`g_ADigitalPinMap`), not the chip's physical port/pin — and Horizon is
   a custom PCB, not a Feather. Needs a real Horizon-specific Arduino
   variant to do correctly.

Including this header on a board other than the two above (or on Horizon)
is a compile-time `#error`, by design — wrong-but-plausible pin values
would be worse than a build failure.

**Known spec issues found while transcribing (need a hardware-team fix in
the source `.ods`, not a code fix):**
- Connector pin 8 (`GPIO_B`) and pin 13 (`GPIO_A/LED`) both assigned GPIO5
  on Spark.
- Connector pin 4 (`SPI_CS1`) and pin 10 (`AIN1`) both assigned GPIO3;
  pin 6 (`SPI_CS2`) and pin 26 (`SDA2`) both assigned GPIO10. (All Reserved
  status, so left undefined in the header rather than picking one.)
- Software-SPI pins (14/16/18) have a chosen bit-bang strategy but no
  chosen GPIO numbers yet.

**Follow-ups this uncovered (not started):**
- Real `solderpop:esp32` / `solderpop:nrf52` Boards Manager platform, if
  first-class board selection (vs. picking a generic devkit + this header)
  is wanted later.
- Pin the two upstream boards above as defaults/recommended in the IDE's
  board picker UI, instead of showing the full generic Arduino board list.
- ClickClack-specific visual-language stdlib nodes (tier 1, item 2) —
  natural next step once a board is selectable; can reuse the I2C address
  constants from this library.
- User-facing ClickClack docs (tier 1, item 3) — `docs/` currently has only
  an internal ESM-migration log.

## 2026-08-25 — caveman-init rule files + .gitignore

**Files:** `.cursor/rules/caveman.mdc`, `.windsurf/rules/caveman.md`,
`.clinerules/caveman.md`, `.github/copilot-instructions.md`,
`.opencode/AGENTS.md`, `AGENTS.md` (all new, then added to `.gitignore`)

**What:** Ran `caveman-init` to drop the caveman activation rule into every
supported IDE-agent rule file. Then gitignored all of them per user request
— these are local dev-tooling config, not meant to be committed.

**Tier:** not part of the codebase-improvement review; unrelated tooling
housekeeping done earlier in this session.
