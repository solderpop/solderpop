'use strict';

// ReasonML variants compile to { TAG: "ConstructorName", _0: ..., _1: ... }
// plain objects -- confirmed by reading Command.bs.js's/Connection.bs.js's
// own compiled output. Constructing expected values that shape directly,
// since ReScript doesn't export variant constructors as callable JS
// functions.
const Command = require('../src/Command.bs.js');

const Ok = a => ({TAG: 'Ok', _0: a});
const Err = a => ({TAG: 'Error', _0: a});
const ExpectedArgs = n => ({TAG: 'EXPECTED_ARGUMENTS', _0: n});
const InvalidArgs = 'INVALID_ARGUMENTS';
const InvalidPort = s => ({TAG: 'INVALID_PORT', _0: s});
const InvalidKeepAlive = s => ({TAG: 'INVALID_KEEPALIVE', _0: s});
const InvalidConnectionType = s => ({TAG: 'INVALID_CONNECTION_TYPE', _0: s});
const InvalidLinkId = s => ({TAG: 'INVALID_LINKID', _0: s});
const UnknownCommand = 'UNKNOWN_COMMAND';

const CIPMUX = a => ({TAG: 'CIPMUX', _0: a});
const PING = a => ({TAG: 'PING', _0: a});
const CIPDOMAIN = a => ({TAG: 'CIPDOMAIN', _0: a});
const CIPSTART = (linkId, connection) => ({TAG: 'CIPSTART', _0: linkId, _1: connection});
const CIPSEND = (linkId, length) => ({TAG: 'CIPSEND', _0: linkId, _1: length});
const CIPCLOSE = linkId => ({TAG: 'CIPCLOSE', _0: linkId});

const TCP = (host, port, keepAlive) => ({TAG: 'TCP', _0: host, _1: port, _2: keepAlive});

describe('Command', () => {
  test('returns UNKNOWN COMMAND error for empty string', () => {
    expect(Command.parse('')).toEqual(Err(UnknownCommand));
  });
  test('returns UNKNOWN COMMAND error for command not from the list', () => {
    expect(Command.parse('lalala')).toEqual(Err(UnknownCommand));
  });

  const testCommand = (input, expected) => {
    test(`parses \`${input}\``, () => {
      expect(Command.parse(input)).toEqual(Ok(expected));
    });
  };

  const argumentsError = (error, input) => {
    test(`returns error for \`${input}\``, () => {
      expect(Command.parse(input)).toEqual(Err(error));
    });
  };

  testCommand('AT', 'AT');
  testCommand('AT+CIPSTATUS', 'CIPSTATUS');
  testCommand('AT+CIFSR', 'CIFSR');

  testCommand('AT+CIPMUX=0', CIPMUX(false));
  testCommand('AT+CIPMUX=1', CIPMUX(true));
  argumentsError(ExpectedArgs(1), 'AT+CIPMUX');
  argumentsError(ExpectedArgs(1), 'AT+CIPMUX=');
  argumentsError(ExpectedArgs(1), 'AT+CIPMUX=,');
  argumentsError(InvalidArgs, 'AT+CIPMUX=2');
  argumentsError(InvalidArgs, 'AT+CIPMUX="lala"');

  testCommand('AT+PING="192.168.0.1"', PING('192.168.0.1'));
  testCommand('AT+PING="google.com"', PING('google.com'));
  argumentsError(ExpectedArgs(1), 'AT+PING');
  argumentsError(InvalidArgs, 'AT+PING=google.com');

  testCommand('AT+CIPDOMAIN="google.com"', CIPDOMAIN('google.com'));
  argumentsError(ExpectedArgs(1), 'AT+CIPDOMAIN');
  argumentsError(InvalidArgs, 'AT+CIPDOMAIN="google.com", "xod.io"');

  const ip = '192.168.0.1';
  const port = 8000;
  const dontKeepAlive = 0;
  const keepAlive = 7200; // max
  const tcp = TCP(ip, port, dontKeepAlive);
  const tcpAlive = TCP(ip, port, keepAlive);

  // Simple TCP
  testCommand('AT+CIPSTART="TCP","192.168.0.1",8000', CIPSTART(0, tcp));
  // With Link ID
  testCommand('AT+CIPSTART=4,"TCP","192.168.0.1",8000', CIPSTART(4, tcp));
  // With KeepAlive
  testCommand('AT+CIPSTART="TCP","192.168.0.1",8000,7200', CIPSTART(0, tcpAlive));
  argumentsError(ExpectedArgs(3), 'AT+CIPSTART');
  argumentsError(ExpectedArgs(3), 'AT+CIPSTART="TCP"');
  argumentsError(ExpectedArgs(3), 'AT+CIPSTART="TCP","192.168.0.1"');
  argumentsError(ExpectedArgs(3), 'AT+CIPSTART=0, "TCP","192.168.0.1",8000,7200,5');
  argumentsError(InvalidArgs, 'AT+CIPSTART="TCP","192.168.0.1",8000,7200,5');
  argumentsError(InvalidPort('"lala"'), 'AT+CIPSTART="TCP","192.168.0.1","lala"');
  argumentsError(InvalidPort('0'), 'AT+CIPSTART="TCP","192.168.0.1",0');
  argumentsError(InvalidKeepAlive('9600'), 'AT+CIPSTART="TCP","192.168.0.1",8000,9600');
  argumentsError(InvalidConnectionType('TCP/IP'), 'AT+CIPSTART="TCP/IP","192.168.0.1",8000');
  argumentsError(InvalidLinkId('-1'), 'AT+CIPSTART=-1,"TCP","192.168.0.1",8000');
  argumentsError(InvalidLinkId('5'), 'AT+CIPSTART=5,"TCP","192.168.0.1",8000');

  testCommand('AT+CIPSEND=42', CIPSEND(0, 42));
  testCommand('AT+CIPSEND=32500', CIPSEND(0, 32500));
  testCommand('AT+CIPSEND=1,32500', CIPSEND(1, 32500));
  argumentsError(InvalidArgs, 'AT+CIPSEND=1,"string is not allowed here"');

  testCommand('AT+CIPCLOSE', CIPCLOSE(0));
  testCommand('AT+CIPCLOSE=1', CIPCLOSE(1));
  testCommand('AT+CIPCLOSE=5', CIPCLOSE(5));
  argumentsError(InvalidArgs, 'AT+CIPCLOSE="bye"');
  argumentsError(ExpectedArgs(1), 'AT+CIPCLOSE=1,2');
});

describe('Parse arguments', () => {
  test('returns empty list of command without arguments at all', () => {
    expect(Command.parseArguments('AT')).toHaveLength(0);
  });
  test('returns empty list for empty string', () => {
    expect(Command.parseArguments('')).toHaveLength(0);
  });
  test('returns empty list for empty list of arguments', () => {
    expect(Command.parseArguments('AT=')).toHaveLength(0);
  });
  test('returns empty list for empty arguments with commas', () => {
    expect(Command.parseArguments('AT=,,,')).toHaveLength(0);
  });

  test('returns a list of one argument', () => {
    expect(Command.parseArguments('AT=1')).toHaveLength(1);
  });
  test('returns a list of two arguments', () => {
    expect(Command.parseArguments('AT=1,2')).toHaveLength(2);
  });
  test('returns a list of three arguments', () => {
    expect(Command.parseArguments('AT=1,"ABC",3')).toHaveLength(3);
  });
  test('returns a list of four arguments', () => {
    expect(Command.parseArguments('AT=1,"ABC","192.168.0.1",8')).toHaveLength(4);
  });
});
