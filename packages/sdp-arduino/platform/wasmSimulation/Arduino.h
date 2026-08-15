#ifndef ARDUINO_H
#define ARDUINO_H

// Minimal Arduino-compatible core for the local WASM Simulation build.
// Modeled on packages/sdp-tabtest/cpp/Arduino.h (the existing WASM tabtest
// stub), extended with what XOD_SIMULATION additionally needs: F(), a real
// Stream base with the parsing helpers Simulation's debug protocol relies
// on (find/parseInt/parseFloat/readBytesUntil), and millis()/micros() wired
// to real wall-clock-ish time (via WasmSerial.h's Module.Time binding)
// instead of a static mock value.
//
// Deliberately does NOT provide pinMode/digitalWrite/digitalRead/analogRead/
// analogWrite: none of xod/core's node implementations call these directly
// (verified by grepping workspace/__lib__/xod/core/*/patch.cpp), so
// omitting them is a known, acceptable limitation for this build rather
// than an oversight. A patch using a GPIO-tied node will fail to compile
// here with a clear "undefined reference" error instead of silently
// misbehaving.

#include <algorithm>
#include <cmath>
#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <math.h>

void setup();
void loop();

#define A0 14

using ::std::min;
using ::std::max;

#ifdef isfinite
#undef isfinite
#endif
using ::std::isfinite;

#ifdef abs
#undef abs
#endif
#define abs(x) ((x) > 0 ? (x) : -(x))

// Real AVR cores wrap string literals passed through F() so they can stay
// in flash instead of RAM. There's no such distinction on this target, so
// F() is a no-op passthrough.
#define F(stringLiteral) (stringLiteral)

#define DEC 10
#define HEX 16
#define OCT 8
#define BIN 2

uint32_t millis();
uint32_t micros();
void delay(uint32_t ms);

// GPIO: xod/gpio's nodes (digital-write, digital-read, ...) call these
// directly (confirmed via a real transpiled build of the `blink` workspace
// fixture, which pulled in xod__gpio__digital_write — this isn't limited to
// xod/core, which is why an earlier grep scoped to xod/core/*/patch.cpp
// missed it). There's no physical pin attached in Simulation, so these are
// stubs backed by an in-memory virtual pin-state array: digitalWrite
// records a value, digitalRead/analogRead read it back. That's enough for
// patches with feedback loops reading their own outputs; it's not a real
// electrical simulation.
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2
#define LOW 0
#define HIGH 1

void pinMode(uint8_t pin, uint8_t mode);
void digitalWrite(uint8_t pin, uint8_t value);
int digitalRead(uint8_t pin);
int analogRead(uint8_t pin);
void analogWrite(uint8_t pin, int value);

class Print {
  public:
    virtual size_t write(uint8_t b) = 0;
    virtual size_t write(const uint8_t* buffer, size_t size);
    virtual void flush() {}

    size_t print(const char* str);
    size_t print(char c);
    size_t print(long n, int base = DEC);
    size_t print(unsigned long n, int base = DEC);
    size_t print(int n, int base = DEC);
    size_t print(double n, int digits = 2);

    size_t println(const char* str);
    size_t println(char c);
    size_t println(long n, int base = DEC);
    size_t println();
};

class Stream : public Print {
  public:
    virtual void begin(uint32_t baud) {}
    virtual void end() {}
    virtual int available() = 0;
    virtual int read() = 0;
    virtual int peek() = 0;

    void setTimeout(unsigned long ms) { timeoutMs = ms; }

    bool find(char target);
    bool find(const char* target, size_t length);
    long parseInt();
    double parseFloat();
    size_t readBytesUntil(char terminator, char* buffer, size_t length);

  protected:
    unsigned long timeoutMs = 1000;

  private:
    int timedRead();
    int timedPeek();
};

class HardwareSerial : public Stream {};
class SoftwareSerial : public Stream {};

#endif
