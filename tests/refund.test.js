const calculateRefund = require('../src/utils/refund');

test.each([
  [49, 150], [48, 75], [36, 75], [24, 75], [23.99, 0], [0, 0], [-1, 0],
])('150 paid with %s hours notice refunds %s', (hours, expected) => {
  expect(calculateRefund('150.00', hours)).toBe(expected);
});

test('refund uses the amount actually paid', () => {
  expect(calculateRefund('80.00', 30)).toBe(40);
});

test('a half-cent rounds up to the nearest cent', () => {
  expect(calculateRefund('10.01', 24)).toBe(5.01);
});
