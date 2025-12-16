-- CREATE PRESCRIPTION_ITEM TABLE
-- This table stores prescription records linked to diagnoses
-- Schema based on the ERD and requirements:
-- - prescriptionitem_id: Primary key
-- - diagnosis_id: Foreign key referencing diagnosis table
-- - quantity: Quantity of medication prescribed
-- - guide: Text field for usage guide
-- - duration: Duration for which the medication is prescribed
-- medication_id: Foreign key referencing medications table

CREATE TABLE prescription_item (
  prescriptionitem_id VARCHAR(50) NOT NULL PRIMARY KEY,
  diagnosis_id VARCHAR(50) NOT NULL,

  medication_id VARCHAR(50) NOT NULL,
  medication_timestamp INT UNSIGNED NOT NULL, -- 👈 version being prescribed

  quantity INT NOT NULL,
  guide TEXT,
  duration TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (prescriptionitem_id),

  FOREIGN KEY (medication_id, medication_timestamp)
    REFERENCES medications(medication_id, timestamp)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  FOREIGN KEY (diagnosis_id)
    REFERENCES diagnosis(diagnosis_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
