USE medibook;

-- Run once on empty tables. Dates stay in the future when the script is run.
SET @busy_day = CURRENT_DATE + INTERVAL 3 DAY;
SET @other_day = CURRENT_DATE + INTERVAL 4 DAY;
SET @booked_on = CURRENT_TIMESTAMP - INTERVAL 2 DAY;

START TRANSACTION;

INSERT INTO patients (id, name, email, phone) VALUES
  (1, 'Ama Mensah', 'ama@example.com', '0244-111-222'),
  (2, 'Kojo Owusu', 'kojo@example.com', '0555-333-444'),
  (3, 'Akosua Asare', 'akosua@example.com', '0202-555-666');

INSERT INTO doctors (id, name, specialty, consultation_fee, room) VALUES
  (1, 'Dr. Boateng', 'Dermatology', 150.00, 'R-12'),
  (2, 'Dr. Adjei', 'Paediatrics', 100.00, 'R-03'),
  (3, 'Dr. Mensah', 'General Medicine', 80.00, 'R-07');

-- A cancelled appointment keeps its payment and full-refund history.
-- The appointment is over 48 hours away at the time of cancellation.
INSERT INTO appointments (
  id, appt_ref, patient_id, doctor_id, appointment_datetime,
  amount_paid, booked_on, status, cancelled_at, refund_amount
) VALUES (
  1, 'AP-001', 1, 1, TIMESTAMP(@busy_day, '09:00:00'),
  150.00, @booked_on, 'cancelled', CURRENT_TIMESTAMP, 150.00
);

-- Dr. Boateng has 11 confirmed bookings on one day, near the limit of 12.
-- AP-002 reuses the cancelled 09:00 slot for a different patient.
INSERT INTO appointments (
  id, appt_ref, patient_id, doctor_id, appointment_datetime, amount_paid, booked_on
) VALUES
  (2, 'AP-002', 2, 1, TIMESTAMP(@busy_day, '09:00:00'), 150.00, CURRENT_TIMESTAMP),
  (3, 'AP-003', 3, 1, TIMESTAMP(@busy_day, '09:30:00'), 150.00, @booked_on),
  (4, 'AP-004', 1, 1, TIMESTAMP(@busy_day, '10:00:00'), 150.00, @booked_on),
  (5, 'AP-005', 2, 1, TIMESTAMP(@busy_day, '10:30:00'), 150.00, @booked_on),
  (6, 'AP-006', 3, 1, TIMESTAMP(@busy_day, '11:00:00'), 150.00, @booked_on),
  (7, 'AP-007', 1, 1, TIMESTAMP(@busy_day, '11:30:00'), 150.00, @booked_on),
  (8, 'AP-008', 2, 1, TIMESTAMP(@busy_day, '12:00:00'), 150.00, @booked_on),
  (9, 'AP-009', 3, 1, TIMESTAMP(@busy_day, '12:30:00'), 150.00, @booked_on),
  (10, 'AP-010', 1, 1, TIMESTAMP(@busy_day, '13:00:00'), 150.00, @booked_on),
  (11, 'AP-011', 2, 1, TIMESTAMP(@busy_day, '13:30:00'), 150.00, @booked_on),
  (12, 'AP-012', 3, 1, TIMESTAMP(@busy_day, '14:00:00'), 150.00, @booked_on),
  (13, 'AP-013', 1, 2, TIMESTAMP(@other_day, '10:00:00'), 80.00, @booked_on);

-- Dr. Mensah deliberately has no appointments for the later doctors report.
COMMIT;
