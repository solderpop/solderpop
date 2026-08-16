const Validator = require('../src/Validator.bs.js');
const BeltList = require('@rescript/runtime/lib/js/Belt_List.js');

const toList = arr => BeltList.fromArray(arr);

const assertNone = expectation => {
  expect(expectation).toBeUndefined();
};

const assertSomeError = (expectedMsg, err) => {
  expect(err).toBeDefined();
  expect(err.message).toBe(expectedMsg);
};

describe('Assert pin labels', () => {
  test('Returns unit for valid pin labels', () => {
    const realPins = ['IN1', 'IN2', 'IN3'];
    const tsvPins = ['IN1', 'IN2', 'IN3'];
    assertNone(Validator.validatePinLabels(toList(realPins), toList(tsvPins)));
  });

  test('Throws missing pin labels error', () => {
    const realPins = ['IN1', 'IN2', 'IN3'];
    const tsvPins = ['IN1'];
    assertSomeError(
      'INVALID_PIN_LABELS_IN_TABTEST {"missing":["IN2","IN3"],"redundant":[],"duplicated":[]}',
      Validator.validatePinLabels(toList(realPins), toList(tsvPins)),
    );
  });

  test('Throws redundant pin labels error', () => {
    const realPins = ['IN1'];
    const tsvPins = ['IN1', 'IN2', 'IN3'];
    assertSomeError(
      'INVALID_PIN_LABELS_IN_TABTEST {"missing":[],"redundant":["IN2","IN3"],"duplicated":[]}',
      Validator.validatePinLabels(toList(realPins), toList(tsvPins)),
    );
  });

  test('Do not throw a redundant pin labels error for special columns like `__time(ms)`', () => {
    const realPins = ['IN1'];
    const tsvPins = ['__time(ms)', 'IN1'];
    assertNone(Validator.validatePinLabels(toList(realPins), toList(tsvPins)));
  });

  test('Throws duplicated pin labels error', () => {
    const realPins = ['IN1'];
    const tsvPins = ['IN1', 'IN1', 'IN1'];
    assertSomeError(
      'INVALID_PIN_LABELS_IN_TABTEST {"missing":[],"redundant":[],"duplicated":["IN1"]}',
      Validator.validatePinLabels(toList(realPins), toList(tsvPins)),
    );
  });

  test('Throws duplicated pin labels error for special columns', () => {
    const realPins = ['IN1'];
    const tsvPins = ['__time(ms)', 'IN1', '__time(ms)'];
    assertSomeError(
      'INVALID_PIN_LABELS_IN_TABTEST {"missing":[],"redundant":[],"duplicated":["__time(ms)"]}',
      Validator.validatePinLabels(toList(realPins), toList(tsvPins)),
    );
  });

  test('Throws all pin labels error', () => {
    const realPins = ['IN1', 'IN2', 'IN3'];
    const tsvPins = ['IN1', 'IN1', 'IN4', 'IN4'];
    assertSomeError(
      'INVALID_PIN_LABELS_IN_TABTEST {"missing":["IN2","IN3"],"redundant":["IN4"],"duplicated":["IN1"]}',
      Validator.validatePinLabels(toList(realPins), toList(tsvPins)),
    );
  });
});
