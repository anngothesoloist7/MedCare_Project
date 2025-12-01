# 📌 Project Title: **MedCare**

## 📄 Brief Description:<br>

**MedCare** is an AI powered patient care system designed to remove the heavy admin work doctors usually rely on nurses for. Doctors speak naturally to record diagnoses, prescriptions, and treatment notes, and the system converts that voice input into structured data stored securely. Patients can log in to track their medications, check usage instructions, and receive updates, while doctors stay informed through real time summaries and alerts. MedCare creates a smoother, more efficient workflow for both patients and clinicians

## 🎯 Functional & Non-functional Requirements

## 🧱 Planned Core Entities (brief outline)

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
