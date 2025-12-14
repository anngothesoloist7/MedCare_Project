-- CREATE MEDICATION COMPLIANCE TABLE (FR-06)
CREATE TABLE IF NOT EXISTS medication_compliance (
    compliance_id INT AUTO_INCREMENT PRIMARY KEY,
    prescriptionitem_id VARCHAR(50) NOT NULL,
    taken_date DATE DEFAULT CURRENT_DATE,
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescriptionitem_id)
        REFERENCES prescription_item(prescriptionitem_id)
        ON DELETE CASCADE
);

