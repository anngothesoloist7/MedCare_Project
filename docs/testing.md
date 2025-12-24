# MedCare Database Testing Guide

**Test Date**: ___________ | **Tester**: ___________ | **MySQL Version**: ___________

---

## Quick Verification

Run these queries to verify your database setup:

```sql
-- Check all objects exist
SELECT 
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'medcare_db' AND TABLE_TYPE = 'BASE TABLE') AS tables,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'medcare_db' AND INDEX_NAME != 'PRIMARY') AS indexes,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = 'medcare_db') AS views,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = 'medcare_db' AND ROUTINE_TYPE = 'PROCEDURE') AS procedures,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = 'medcare_db') AS triggers;
```

**Expected**: Tables: 4 | Indexes: 11 | Views: 6 | Procedures: 2 | Triggers: 3

**Actual**: Tables: ___ | Indexes: ___ | Views: ___ | Procedures: ___ | Triggers: ___

**Status**: ☐ PASS ☐ FAIL

---

## 1. Schema Tests

### Test 1.1: Foreign Keys
```sql
SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'medcare_db' AND REFERENCED_TABLE_NAME IS NOT NULL;
```

**Expected**: 4 foreign keys | **Actual**: _____ | **Status**: ☐ PASS ☐ FAIL

---

## 2. CRUD Tests

### Test 2.1: Create & Update Medication
```sql
-- Insert
INSERT INTO medications (name, description, stock_quantity, unit_price)
VALUES ('Test Med', 'Test', 100, 10.00);

-- Update
UPDATE medications SET stock_quantity = 150 WHERE name = 'Test Med';

-- Verify
SELECT * FROM medications WHERE name = 'Test Med';
```

**Stock Updated**: ☐ YES ☐ NO | **Status**: ☐ PASS ☐ FAIL

### Test 2.2: Delete Prevention
```sql
DELETE FROM diagnosis WHERE diagnosis_id = 1;
```

**Expected**: Error "Diagnosis records cannot be deleted for audit purposes"

**Deletion Prevented**: ☐ YES ☐ NO | **Status**: ☐ PASS ☐ FAIL

---

## 3. Stored Procedure Tests

### Test 3.1: Add Prescription with Stock Check
```sql
-- Check initial stock
SELECT stock_quantity FROM medications WHERE medication_id = 1;
-- Initial: _____

-- Add prescription
CALL sp_AddPrescriptionItem(1, 1, 5, 'Take twice daily', '7 days', 'DOCTOR_ID');

-- Check final stock
SELECT stock_quantity FROM medications WHERE medication_id = 1;
-- Final: _____
```

**Stock Decreased by 5**: ☐ YES ☐ NO | **Status**: ☐ PASS ☐ FAIL

### Test 3.2: Insufficient Stock Error
```sql
CALL sp_AddPrescriptionItem(1, 1, 999999, 'Test', 'Test', 'DOCTOR_ID');
```

**Expected**: Error "Insufficient stock"

**Error Thrown**: ☐ YES ☐ NO | **Status**: ☐ PASS ☐ FAIL

---

## 4. View Tests

### Test 4.1: Medication Popularity
```sql
SELECT * FROM vw_MedicationPopularity LIMIT 5;
```

**Has usage_count column**: ☐ YES ☐ NO | **Sorted DESC**: ☐ YES ☐ NO | **Status**: ☐ PASS ☐ FAIL

### Test 4.2: Low Stock Alert
```sql
SELECT * FROM vw_LowStockMedications;
```

**Returns 5 records**: ☐ YES ☐ NO | **Sorted by stock ASC**: ☐ YES ☐ NO | **Status**: ☐ PASS ☐ FAIL

---

## 5. Performance Test (NFR-03)

**Requirement**: Patient records retrieved in < 3 seconds

```sql
SET @start = NOW(6);

SELECT * FROM diagnosis 
WHERE patient_id = 'YOUR_PATIENT_ID'
ORDER BY date DESC;

SET @end = NOW(6);

SELECT TIMESTAMPDIFF(MICROSECOND, @start, @end) / 1000000 AS seconds;
```

**Execution Time**: _____ seconds | **Meets Requirement (< 3s)**: ☐ YES ☐ NO | **Status**: ☐ PASS ☐ FAIL

---

## 6. Index Performance Comparison

### Before Indexes (Optional - for comparison)

Drop indexes temporarily:
```sql
DROP INDEX idx_diagnosis_patient_date ON diagnosis;
-- Test query speed here
```

### After Indexes

Recreate indexes:
```bash
mysql -u root -p medcare_db < sql/schema/create_indexes.sql
```

Test same query and compare:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Execution Time | ___s | ___s | ___% faster |
| Rows Examined | ___ | ___ | Reduced by ___ |

**Indexes Working**: ☐ YES ☐ NO

---

## Test Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Schema | 1 | ___ | ___ |
| CRUD | 2 | ___ | ___ |
| Procedures | 2 | ___ | ___ |
| Views | 2 | ___ | ___ |
| Performance | 1 | ___ | ___ |
| **TOTAL** | **8** | **___** | **___** |

**Pass Rate**: _____%

---

## Overall Assessment

**Status**: ☐ All Tests Pass ☐ Minor Issues ☐ Major Issues

**Issues Found**:
1. _________________________________________________________________
2. _________________________________________________________________

**Recommendations**:
1. _________________________________________________________________
2. _________________________________________________________________

**Final Result**: ☐ PASS ☐ FAIL
