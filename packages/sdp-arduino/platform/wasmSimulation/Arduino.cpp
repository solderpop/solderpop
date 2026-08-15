#include "Arduino.h"

// millis()/micros() are implemented in WasmSerial.cpp, bound to the JS-side
// Module.Time object (see wasm.worker.js) — that's the only thing in this
// file that actually needs the Emscripten JS bridge, everything else here
// is plain, portable C++.

void delay(uint32_t ms) {
  // XOD-generated programs are cooperatively scheduled and don't rely on
  // delay() blocking; matches packages/sdp-tabtest/cpp/Arduino.cpp's
  // existing no-op behavior for the same reason.
}

namespace {
const int kPinCount = 128;
int g_pinValues[kPinCount] = {0};

int clampPin(uint8_t pin) {
  return pin < kPinCount ? pin : 0;
}
} // namespace

void pinMode(uint8_t pin, uint8_t mode) {
  // No physical pin to configure in Simulation.
}

void digitalWrite(uint8_t pin, uint8_t value) {
  g_pinValues[clampPin(pin)] = value ? HIGH : LOW;
}

int digitalRead(uint8_t pin) {
  return g_pinValues[clampPin(pin)];
}

int analogRead(uint8_t pin) {
  return g_pinValues[clampPin(pin)];
}

void analogWrite(uint8_t pin, int value) {
  g_pinValues[clampPin(pin)] = value;
}

size_t Print::write(const uint8_t* buffer, size_t size) {
  size_t n = 0;
  for (size_t i = 0; i < size; i++) {
    n += write(buffer[i]);
  }
  return n;
}

size_t Print::print(const char* str) {
  size_t n = 0;
  while (*str) {
    n += write((uint8_t)*str++);
  }
  return n;
}

size_t Print::print(char c) {
  return write((uint8_t)c);
}

size_t Print::print(long n, int base) {
  if (base == 10) {
    char buf[8 * sizeof(long) + 2];
    char* p = buf + sizeof(buf) - 1;
    *p = '\0';
    bool neg = n < 0;
    unsigned long un = neg ? -(unsigned long)n : (unsigned long)n;
    do {
      *--p = '0' + (un % 10);
      un /= 10;
    } while (un > 0);
    if (neg) *--p = '-';
    return print(p);
  }
  return print((unsigned long)n, base);
}

size_t Print::print(unsigned long n, int base) {
  char buf[8 * sizeof(long) + 2];
  char* p = buf + sizeof(buf) - 1;
  *p = '\0';
  const char* digits = "0123456789abcdef";
  do {
    *--p = digits[n % base];
    n /= base;
  } while (n > 0);
  return print(p);
}

size_t Print::print(int n, int base) {
  return print((long)n, base);
}

size_t Print::print(double n, int digits) {
  char buf[64];
  snprintf(buf, sizeof(buf), "%.*f", digits, n);
  return print(buf);
}

size_t Print::println(const char* str) {
  size_t n = print(str);
  n += print("\r\n");
  return n;
}

size_t Print::println(char c) {
  size_t n = print(c);
  n += print("\r\n");
  return n;
}

size_t Print::println(long n, int base) {
  size_t r = print(n, base);
  r += print("\r\n");
  return r;
}

size_t Print::println() {
  return print("\r\n");
}

int Stream::timedRead() {
  unsigned long start = millis();
  int c;
  do {
    c = read();
    if (c >= 0) return c;
  } while (millis() - start < timeoutMs);
  return -1;
}

int Stream::timedPeek() {
  unsigned long start = millis();
  int c;
  do {
    c = peek();
    if (c >= 0) return c;
  } while (millis() - start < timeoutMs);
  return -1;
}

bool Stream::find(char target) {
  return find(&target, 1);
}

bool Stream::find(const char* target, size_t length) {
  if (length == 0) return true;
  size_t matched = 0;
  while (true) {
    int c = timedRead();
    if (c < 0) return false;
    if ((char)c == target[matched]) {
      matched++;
      if (matched == length) return true;
    } else {
      matched = ((char)c == target[0]) ? 1 : 0;
    }
  }
}

long Stream::parseInt() {
  bool neg = false;
  long value = 0;
  int c;

  do {
    c = timedPeek();
    if (c < 0) return 0;
  } while (c != '-' && (c < '0' || c > '9'));

  if (c == '-') {
    neg = true;
    timedRead();
    c = timedPeek();
  }

  bool sawDigit = false;
  while (c >= '0' && c <= '9') {
    sawDigit = true;
    value = value * 10 + (c - '0');
    timedRead();
    c = timedPeek();
  }

  if (!sawDigit) return 0;
  return neg ? -value : value;
}

double Stream::parseFloat() {
  bool neg = false;
  double value = 0;
  int c;

  do {
    c = timedPeek();
    if (c < 0) return 0;
  } while (c != '-' && (c < '0' || c > '9') && c != '.');

  if (c == '-') {
    neg = true;
    timedRead();
    c = timedPeek();
  }

  while (c >= '0' && c <= '9') {
    value = value * 10 + (c - '0');
    timedRead();
    c = timedPeek();
  }

  if (c == '.') {
    timedRead();
    c = timedPeek();
    double fraction = 0.1;
    while (c >= '0' && c <= '9') {
      value += (c - '0') * fraction;
      fraction *= 0.1;
      timedRead();
      c = timedPeek();
    }
  }

  return neg ? -value : value;
}

size_t Stream::readBytesUntil(char terminator, char* buffer, size_t length) {
  size_t count = 0;
  while (count < length) {
    int c = timedRead();
    if (c < 0 || (char)c == terminator) break;
    buffer[count++] = (char)c;
  }
  return count;
}
