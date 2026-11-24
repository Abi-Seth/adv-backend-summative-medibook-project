CREATE DATABASE IF NOT EXISTS medibook
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE medibook;

CREATE TABLE patients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  CONSTRAINT patients_email_unique UNIQUE (email)
) ENGINE = InnoDB;

CREATE TABLE doctors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  consultation_fee DECIMAL(10, 2) NOT NULL,
  room VARCHAR(20) NOT NULL,
  CONSTRAINT doctors_fee_nonnegative CHECK (consultation_fee >= 0)
) ENGINE = InnoDB;

CREATE TABLE appointments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  appt_ref VARCHAR(20) NOT NULL,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appointment_datetime DATETIME NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  booked_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  cancelled_at DATETIME NULL DEFAULT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Cancelled rows keep their history without reserving the doctor's slot.
  active_slot DATETIME GENERATED ALWAYS AS (
    CASE WHEN status = 'confirmed' THEN appointment_datetime ELSE NULL END
  ) VIRTUAL,

  CONSTRAINT appointments_ref_unique UNIQUE (appt_ref),
  CONSTRAINT appointments_doctor_slot_unique UNIQUE (doctor_id, active_slot),
  CONSTRAINT appointments_patient_fk FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT appointments_doctor_fk FOREIGN KEY (doctor_id)
    REFERENCES doctors(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT appointments_paid_nonnegative CHECK (amount_paid >= 0),
  CONSTRAINT appointments_refund_range CHECK (
    refund_amount >= 0 AND refund_amount <= amount_paid
  ),
  CONSTRAINT appointments_cancellation_details CHECK (
    (status = 'confirmed' AND cancelled_at IS NULL AND refund_amount = 0)
    OR (status = 'cancelled' AND cancelled_at IS NOT NULL)
  ),
  CONSTRAINT appointments_working_slot CHECK (
    TIME(appointment_datetime) >= '09:00:00'
    AND TIME(appointment_datetime) < '17:00:00'
    AND MINUTE(appointment_datetime) IN (0, 30)
    AND SECOND(appointment_datetime) = 0
  )
) ENGINE = InnoDB;

-- Future-only bookings, the daily limit of 12, and refund percentages
-- will be enforced by the booking/cancellation code in later work days.
