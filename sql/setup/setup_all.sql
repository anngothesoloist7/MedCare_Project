-- MASTER SETUP SCRIPT
-- This script runs all database setup operations in the correct order
-- Execute this to completely set up the MedCare database from scratch

-- Step 1: Create database
SOURCE sql/setup/create_database.sql;

-- Step 2: Create all tables (in dependency order)
SOURCE sql/schema/01_users.sql;
SOURCE sql/schema/02_doctors.sql;
SOURCE sql/schema/03_patients.sql;
SOURCE sql/schema/04_diagnosis.sql;
SOURCE sql/schema/05_medications.sql;
SOURCE sql/schema/06_prescription_item.sql;
SOURCE sql/schema/07_medication_audit.sql;
SOURCE sql/schema/08_medication_compliance.sql;

-- Step 3: Create triggers
SOURCE sql/triggers/create_triggers.sql;

-- Step 4: Create procedures
SOURCE sql/procedures/create_procedures.sql;

-- Step 5: Create views
SOURCE sql/views/create_views.sql;

-- Step 6: Insert initial data
SOURCE sql/setup/initial_data.sql;

-- Show completion message
SELECT 'MedCare database setup completed successfully!' as status;
SELECT 'All tables, triggers, procedures, views, and initial data have been created.' as details;