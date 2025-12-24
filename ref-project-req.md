MySQL-Based Information System Project
1. Vocational Context
As a Database Developer, you are responsible for conceptualizing and implementing a fresh Information System solution for an organization. This project relies exclusively on MySQL for all relational database operations, covering:
	•	Requirements analysis
	•	Conceptual and physical database design
	•	Implementation of database objects (tables, views, procedures, triggers, etc.)
	•	Performance tuning
	•	Security configuration
	•	End-to-end testing
Additionally, you are also required to develop a web-based interface for the system. This website should allow users to interact with the database through a user-friendly UI, enabling features such as:
	•	Entities management
	•	Statistics tracking
	•	Reporting and data visualization
	•	User authentication and role-based access control
You may use any suitable web development stack (e.g., HTML/CSS/JavaScript with PHP, Node.js, Python Flask/Django, etc.) for building the website, ensuring seamless integration with the MySQL database.
2. General Requirements
All database components must be implemented in MySQL, using MySQL Workbench or the MySQL command-line interface. Development should leverage ANSI SQL standards alongside MySQL-specific features such as stored procedures, triggers, and partitioning. Security must be enforced at the database level with clear user roles and privilege assignments.
Examples of typical systems for student projects include:
	•	Inventory Management System: Track stock levels, suppliers, and reorder alerts.
	•	Human Resources Information System (HRIS): Manage employee records, timekeeping, and payroll.
	•	Customer Relationship Management (CRM): Handle customer profiles, interactions, and service tickets.
	•	Library Management System: Catalog books, borrowers, and loan histories.
	•	Financial Accounting System: Record journals, ledger entries, and generate financial reports.
	•	Healthcare Management System: Maintain patient records, appointments, and billing
	•	…. You name it

Important notes: - Projects may vary in complexity depending on requirements and student skill levels. - Select a system that showcases practical MySQL features and real-world applicability.
3. Timelines
Activity
Deadline
Team registration & topic selection
Monday, Dec 1
Peer review (evaluate other teams' proposals)
Monday, Dec 8
Submit design document (ERD, DDL, task division)
Monday, Dec 15
Final submission & presentation slide
Monday, Dec 22
4. Rubrics
Note: These are only the basic criteria, feel free to be creative and go beyond them in your project.
Category
Criteria
Points
1. Conceptual & Physical Design
- Functional & non-functional requirements clearly stated - Logical ERD (minimum 4 entities) - Proper normalization up to 3NF - Accurate DDL scripts with keys, constraints
4 pts
2. Implementation of DB Entities
- Creation of all required tables and relationships - At least one view - At least two stored procedures - At least one trigger
4 pts
3. Performance Tuning
- Use of indexing and/or partitioning - Query optimization evidence (before vs after execution plan or timing) - Optional OLTP workload simulation
3 pts
4. Security Configuration
- User roles and privileges correctly assigned - Use of encryption functions for sensitive data (e.g., passwords) - Prevent SQL injection via prepared statements
3 pts
5. End-to-End Testing & Web Integration
- Website fully functional (CRUD + Analytics) - Proper data visualization - Successful user interaction and reporting - All functionality thoroughly tested
4 pts
6. Presentation & Documentation
- Clear explanation of architecture & key decisions - Q&A readiness and confidence - Clean and reproducible code (GitHub repo) - Submission of slides and final report (PDF)
2 pts
5. Functional Requirements
Entities Management
Maintain a comprehensive list of entities with fundamental fields such as id, name, .... Implement add, edit, delete, and search operations using parameterized SQL. Enable filtering and sorting by specific criteria. Define appropriate data types and constraints for the table.
Analytics and Reporting
Use GROUP BY and window functions to calculate daily, monthly, and annual statistics. Create views or materialized tables for frequent reporting.
6. Security Requirements
Create MySQL user accounts with least-privilege grants for admin, normal user, and other roles. Encrypt sensitive fields (e.g., password) using MySQL encryption functions.
7. Website Requirement
Students must create a website that showcases all implemented Project features, including interactive modules for: - Entities Management - Analytics & Reporting The web interface should connect to the MySQL backend and present data dynamically, allowing users to perform CRUD operations and view real-time reports.
8. Project Activities
Activity 1: Conceptual & Logical Design - Define functional and non-functional requirements. - Draw an ERD with at least four core entities. - Normalize to 3NF and document tables, keys, and indexes. - Provide SQL DDL scripts. Activity 2: Physical Implementation - Deploy schema in MySQL. - Load sample data. - Develop stored procedures (e.g., add, update). - Implement triggers for audit logging and data validation. - Apply indexing and partitioning strategies. Activity 3: Verification & Validation - Ensure schema matches requirements. - Test constraints and referential integrity. Activity 4: Performance Testing - Simulate OLTP workloads. (Optional) - Optimize queries and schema; document improvements. Activity 5: Final Presentation - Prepare a 10–15 minute demonstration of CRUD operations, reporting, and admin functions. - Collect and incorporate peer feedback.
9. Expected output:
Presentation:
	•	Submit slides on Canvas (PDF format).
	•	Deliver an in-class presentation with a Q&A session.
Report:
	•	Submit your report on canvas in Pdf format
	•	Your code for the project should be well documented and reproducible, i.e. we can retrieve the same output which you present through running your code, the code must be published on GitHub.
 


