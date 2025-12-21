-- ============================================================
-- Trigger: trg_AfterInsert_PrescriptionItem
-- ============================================================
-- Purpose: Automatically decrements medication stock when a prescription item is inserted
-- This provides automatic stock management at the database level
--
-- Why this trigger exists:
-- When a doctor prescribes medication, the stock should automatically decrease.
-- Previously, this was handled in the stored procedure sp_AddPrescriptionItem.
-- Now, the trigger handles the stock decrement, providing:
-- 1. Separation of concerns - the procedure validates, the trigger updates
-- 2. Guaranteed consistency - stock always decreases when prescription is added
-- 3. Works even if INSERT is done directly (not through stored procedure)
--
-- Type: AFTER INSERT trigger
-- Table: prescription_item
-- Action: Decrements stock_quantity in medications table
--
-- How it works:
-- 1. After a prescription_item is inserted
-- 2. The trigger reads NEW.medication_id and NEW.quantity
-- 3. It updates the medications table to decrease stock_quantity
--
-- Note: Stock validation (ensuring sufficient stock) is still done
-- in the stored procedure BEFORE the insert. The trigger just handles
-- the decrement after a successful insert.
--
-- Connected to:
-- - prescription_item table (watches INSERTs on this table)
-- - medications table (updates stock_quantity)
-- - Used by: POST /api/diagnosis endpoint via sp_AddPrescriptionItem
--
-- Note: Single-statement trigger syntax (no BEGIN/END) works better with MySQL drivers
-- The UPDATE statement decrements stock by NEW.quantity for NEW.medication_id
-- ============================================================

CREATE TRIGGER trg_AfterInsert_PrescriptionItem
AFTER INSERT ON prescription_item
FOR EACH ROW
UPDATE medications SET stock_quantity = stock_quantity - NEW.quantity WHERE medication_id = NEW.medication_id;
