const { validateAppointmentTime, parseDateTime, clinicNow, validateDate } = require('../src/utils/time');
const { parseId, money, validatePatient, validateDoctor, validateBooking } = require('../src/utils/validation');

const now = new Date('2026-11-24T06:00:00Z');

test.each(['2026-11-24 09:00:00', '2026-11-24 16:30:00'])('accepts valid slot %s', value => {
  expect(validateAppointmentTime(value, now)).toBe(value);
});

test.each([
  '2026-11-24 17:00:00', '2026-11-24 09:15:00', '2026-11-24 08:30:00',
  '2026-11-24 09:00:01', '2026-11-23 12:00:00', '2026-02-30 09:00:00',
  'not-a-date', '2026-13-01 09:00:00', '2026-11-24 24:00:00',
])('rejects invalid slot %s', value => {
  expect(() => validateAppointmentTime(value, now)).toThrow();
});

test('rejects a slot starting exactly now', () => {
  expect(() => validateAppointmentTime('2026-11-24 09:00:00', new Date('2026-11-24T07:00:00Z'))).toThrow(/future/);
});

test('normalizes HTML-style input and uses Kigali time', () => {
  expect(validateAppointmentTime('2026-11-24T09:00', now)).toBe('2026-11-24 09:00:00');
  expect(parseDateTime('2026-11-24 09:00:00').date.toISOString()).toBe('2026-11-24T07:00:00.000Z');
  expect(clinicNow(new Date('2026-11-24T23:00:00Z'))).toBe('2026-11-25 01:00:00');
});

test('validates leap days', () => {
  expect(validateDate('2028-02-29')).toBe('2028-02-29');
  expect(() => validateDate('2027-02-29')).toThrow();
});

test.each([0, -1, '1 OR 1=1', 1.5, null, 4294967296])('rejects invalid id %s', value => {
  expect(() => parseId(value)).toThrow();
});

test.each([-1, '1.001', 'NaN', Infinity, true, null, '100000000'])('rejects invalid money %s', value => {
  expect(() => money(value, 'amount_paid')).toThrow();
});

test('patient validation trims fields and normalizes email', () => {
  expect(validatePatient({ name: ' Ama ', email: 'AMA@example.com', phone: '+250 788 123 456' })).toEqual({ name: 'Ama', email: 'ama@example.com', phone: '+250 788 123 456' });
  expect(() => validatePatient({ name: 'Ama', email: 'invalid', phone: '123' })).toThrow();
});

test('doctor validation requires a non-negative fee', () => {
  expect(() => validateDoctor({ name: 'Doctor', specialty: 'General', room: 'A', consultation_fee: -1 })).toThrow();
});

test('booking only accepts its defined fields', () => {
  const result = validateBooking({ patient_id: 1, doctor_id: 2, appointment_datetime: '2026-11-24 09:00', amount_paid: 0, status: 'cancelled', refund_amount: 100 }, now);
  expect(result).toEqual({ patient_id: 1, doctor_id: 2, appointment_datetime: '2026-11-24 09:00:00', amount_paid: '0.00' });
});
