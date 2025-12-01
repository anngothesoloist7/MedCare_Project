# 📌 Project Title: **MedCare**

## 📄 Brief Description:<br>

**MedCare** is an AI powered patient care system designed to remove the heavy admin work doctors usually rely on nurses for. Doctors speak naturally to record diagnoses, prescriptions, and treatment notes, and the system converts that voice input into structured data stored securely. Patients can log in to track their medications, check usage instructions, and receive updates, while doctors stay informed through real time summaries and alerts. MedCare creates a smoother, more efficient workflow for both patients and clinicians

## 🎯 Functional & Non-functional Requirements
### 1. Functional Requirements (FR)

#### A. For Doctors (Clinical Operations)
* **FR-01: AI-Assisted Consultation Recording**
    * Doctors can record voice notes during visits.
    * System converts voice to text and extracts structured data (symptoms, diagnosis) via AI APIs.
    * Auto-fills patient tracking forms for review before saving.
* **FR-02: Medication Management** *(Implicit from description)*
    * Medications selected from the system catalog.
    * Automatic stock availability check before acceptance.
* **FR-03: Patient History Retrieval**
    * View comprehensive timelines of past consultations, diagnoses, and treatments.
* **FR-04: Clinical Dashboard**
    * Display daily statistics (e.g., Total patients treated).

#### B. For Patients (Personal Health Management)
* **FR-05: Medical Record Access**
    * Log in to view consultation history and doctor notes (Read-only).
* **FR-06: Medication Tracking**
    * View active prescriptions with dosage instructions.
    * Mark doses as "Taken" to track compliance.

#### C. For Administrators (System Management)
* **FR-07: User Management**
    * Create accounts for Doctors and Patients with Role-Based Access Control (RBAC).
* **FR-08: Medication Catalog Management**
    * CRUD operations for medications (name, unit, price, stock).
* **FR-09: System Reporting**
    * Generate monthly reports on clinic performance and drug usage.

### 2. Non-Functional Requirements (NFR)

* **NFR-01: Data Integrity & Accuracy**
    * Enforce Referential Integrity (Foreign Keys).
    * Strict data types (e.g., `DECIMAL` for prices).
* **NFR-02: Security & Privacy**
    * **Encryption:** Passwords hashed using SHA256 or bcrypt.
    * **Access Control:** Strict isolation of user data enforcing RBAC.
* **NFR-03: Performance**
    * Retrieve records in < 2 seconds for up to 10,000 records.
    * Indexing on frequently queried columns (`patient_id`, `consultation_date`).
* **NFR-04: Scalability**
    * Database schema normalized to **3NF** (Third Normal Form).

## 🧱 Planned Core Entities (brief outline)
1.  **Users** (Base Authentication Table)
    * `user_id` (PK), `email`, `phone_number`, `password_hash`, `full_name`, `role` ('Admin', 'Doctor', 'Patient'), `dob`.
2.  **Admin** (Extends Users - 1:1)
    * `admin_id` (PK, FK -> Users).
3.  **Patients** (Extends Users - 1:1)
    * `patient_id` (PK, FK -> Users), `age`, `height`, `sex`.
4.  **Doctors** (Extends Users - 1:1)
    * `doctor_id` (PK, FK -> Users), `speciality`.
5.  **Medications** (Catalog)
    * `medication_id` (PK), `name`, `description`, `stock_quantity`, `unit_price`.
6.  **Diagnosis** (Core Transaction/Consultation)
    * `diagnosis_id` (PK), `doctor_id`, `patient_id`, `diagnosis`, `date`, `next_checkup`.
7.  **PrescriptionsItem** (Junction Table: M:N)
    * `prescriptionitem_id` (PK), `diagnosis_id` (FK), `medication_id` (FK), `quantity`, `guide`, `duration`.

## 🔧 Tech Stack:

MySQL + Next.js + Clerk (for Authentication & User Management)

## 👥 Team Members and Roles

| Name                | Role                        |
| ------------------- | --------------------------- |
| Pham Quynh Trang    | Database + AI + Frontend    |
| Nguyen Thi Bao Tien | Database + API + Deployment |
| Ngo Thanh An        | Database + Backend          |

## 📅 Timeline (planned milestones)

| Week/Date                   | Activity/Phase                                              | Detailed Tasks                                                                                                                                                                                                                                                                                                                                                                       | Key Deliverable / Milestone                                                                                                 |
| --------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Week 1: Dec 1 - Dec 7**   | Phase 1: Database Design & Planning (Completed/In Progress) | - Review and finalize all functional and non-functional requirements<br>- Finalize ERD and 3NF schema design (Users, Doctors, Patients, Prescriptions, etc)<br>- Write initial DDL scripts for all 8 core tables (create tables, define primary and foreign keys, ENUM types)                                                                                                        | Milestone 1: Finalized ERD, full DDL scripts, completion of conceptual and logical design                                   |
| **Week 2: Dec 8 - Dec 14**  | Phase 2: Core DB Implementation and Logic                   | - Peer review (Due Dec 8)<br>- Implement all DDL in MySQL Workbench or CLI<br>- Implement 5 stored procedures (focus on sp_IssuePrescriptionItem with FOR UPDATE locking and ACID transaction logic)<br>- Implement 2 triggers (trg_Audit_StockUpdate, trg_Prevent_Prescription_Deletion)<br>- Load sample data into all tables                                                      | Milestone 2: All tables, procedures, and triggers implemented, physical implementation nearly complete                      |
| **Week 3: Dec 15 - Dec 21** | Phase 3: Security, Reporting and Frontend Integration       | - Submit design document (Due Dec 15)<br>- Implement 2 views (vw_MonthlyClinicStats, vw_PatientMyMeds)<br>- Apply indexing for performance tuning (patient_id, doctor_id, Medications.name)<br>- Build Next.js backend API to connect to MySQL and call stored procedures<br>- Implement authentication and RBAC for Admin, Doctor, and Patient roles                                | Milestone 3: Secure DB plus API integration ready, all views created, indexing complete, security configuration implemented |
| **Week 4: Dec 22 - Dec 28** | Phase 4: Finalization, Testing and Deployment               | - Final submission and presentation slide (Due Dec 22)<br>- Complete UI and UX for Doctor Dashboard, Patient Portal, Admin Reports<br>- Perform end-to-end testing: CRUD, sp_IssuePrescriptionItem, access control workflow<br>- Optimize queries to meet NFR-03 target under 2 seconds<br>- Prepare demo presentation and final documentation (PDF)<br>- Publish all code to GitHub | Milestone 4: Final functional website, full testing complete, final submission delivered and project ready for demo         |
