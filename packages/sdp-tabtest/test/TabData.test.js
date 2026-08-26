const BeltList = require('@rescript/runtime/lib/js/Belt_List.js');
const BeltMapString = require('@rescript/runtime/lib/js/Belt_MapString.js');
const TabData = require('../src/TabData.bs.js');

// TabData.t is a Belt.List<Belt.Map.String<Value.t>>; flatten it to plain
// arrays of [key, value] pairs (sorted by key, per Belt_MapString.toArray)
// so it can be compared with toEqual.
const toPlain = (records) =>
  BeltList.toArray(records).map((record) => BeltMapString.toArray(record));

const Number_ = (x) => ({ TAG: 'Number', _0: x });
const Boolean_ = (x) => ({ TAG: 'Boolean', _0: x });
const Byte_ = (x) => ({ TAG: 'Byte', _0: x });
const String_ = (x) => ({ TAG: 'String', _0: x });
const Pulse_ = (x) => ({ TAG: 'Pulse', _0: x });
const ApproxNumber_ = (x, exp) => ({ TAG: 'ApproxNumber', _0: x, _1: exp });

describe('TSV parser', () => {
  test('parses empty tsv into empty data', () => {
    expect(toPlain(TabData.parse(''))).toEqual([]);
  });

  test('parses header-only tsv into empty data', () => {
    expect(toPlain(TabData.parse('foo\tBAR\tBaz'))).toEqual([]);
  });

  test('parses header and a line into a single record', () => {
    const tsv = 'foo\tBAR\tBaz\n' + '111\t222\t333\n';
    expect(toPlain(TabData.parse(tsv))).toEqual([
      [
        ['BAR', Number_(222)],
        ['Baz', Number_(333)],
        ['foo', Number_(111)],
      ],
    ]);
  });

  test('ignores empty lines', () => {
    const tsv = 'foo\tBAR\tBaz\n' + ('\n\n' + ('111\t222\t333\n' + '\n\n'));
    expect(toPlain(TabData.parse(tsv))).toEqual([
      [
        ['BAR', Number_(222)],
        ['Baz', Number_(333)],
        ['foo', Number_(111)],
      ],
    ]);
  });

  test('matches data to header by shortest sequence', () => {
    const tsv = 'foo\tBAR\tBaz\n' + ('111\t222\n' + '111\t222\t333\t444\n');
    expect(toPlain(TabData.parse(tsv))).toEqual([
      [
        ['BAR', Number_(222)],
        ['foo', Number_(111)],
      ],
      [
        ['BAR', Number_(222)],
        ['Baz', Number_(333)],
        ['foo', Number_(111)],
      ],
    ]);
  });

  test('skips empty lines and comments', () => {
    const tsv =
      'A\tB\tC\n' +
      ('// This comment should be ommited\n' +
        ('1\ttrue\t"Hey"\n' +
          ('\t\t\n' +
            (' \t \t \n' +
              ('\n' +
                (' \t \t //--This line and three above should be ommited too\n' +
                  ('2\tfalse\t"Hello"    // Comment should be ommited\n' +
                    ('3\tfalse\t"Slashes inside //String should not be ommited" // This comment should be ommited\n' +
                      '4\ttrue\t""'))))))));
    expect(toPlain(TabData.parse(tsv))).toEqual([
      [
        ['A', Number_(1)],
        ['B', Boolean_(true)],
        ['C', String_('Hey')],
      ],
      [
        ['A', Number_(2)],
        ['B', Boolean_(false)],
        ['C', String_('Hello')],
      ],
      [
        ['A', Number_(3)],
        ['B', Boolean_(false)],
        ['C', String_('Slashes inside //String should not be ommited')],
      ],
      [
        ['A', Number_(4)],
        ['B', Boolean_(true)],
        ['C', String_('')],
      ],
    ]);
  });

  test('recognizes types', () => {
    const tsv =
      'Number\tBoolean\tByte\tString\tPulse\n' +
      ('+.5\ttrue\t00h\t"Hello"\tpulse\n' +
        ('-42\ttrue\t00001101b\t"World"\tpulse\n' +
          ('-1.243~\tfalse\t11111111b\t"!"\tno-pulse\n' +
            '1.3\tfalse\t255d\t"Some "quoted" string"\tno-pulse')));
    expect(toPlain(TabData.parse(tsv))).toEqual([
      [
        ['Boolean', Boolean_(true)],
        ['Byte', Byte_(0)],
        ['Number', Number_(0.5)],
        ['Pulse', Pulse_(true)],
        ['String', String_('Hello')],
      ],
      [
        ['Boolean', Boolean_(true)],
        ['Byte', Byte_(13)],
        ['Number', Number_(-42)],
        ['Pulse', Pulse_(true)],
        ['String', String_('World')],
      ],
      [
        ['Boolean', Boolean_(false)],
        ['Byte', Byte_(255)],
        ['Number', ApproxNumber_(-1.243, 3)],
        ['Pulse', Pulse_(false)],
        ['String', String_('!')],
      ],
      [
        ['Boolean', Boolean_(false)],
        ['Byte', Byte_(255)],
        ['Number', Number_(1.3)],
        ['Pulse', Pulse_(false)],
        ['String', String_('Some "quoted" string')],
      ],
    ]);
  });
});
