-- PRESCRIPTION ITEMS TABLE
INSERT INTO prescriptionitem 
(prescriptionitem_id, diagnosis_id, quantity, guide, duration, medication_id) 
VALUES
('RX001', 'DX001', 30, 'Take 1 tablet daily in the morning', '30 days', 'M001'),
('RX002', 'DX001', 60, 'Take 1 tablet twice daily with meals', '60 days', 'M017'),
('RX003', 'DX002', 60, 'Take 1 tablet twice daily with food', '30 days', 'M002'),
('RX004', 'DX003', 20, 'Take 1 capsule every 8 hours', '7 days', 'M003'),
('RX005', 'DX003', 30, 'Take as needed for cough, 1 tablet every 6 hours', '10 days', 'M008'),
('RX006', 'DX004', 45, 'Take 1 tablet at onset of migraine', '45 days', 'M004'),
('RX007', 'DX005', 30, 'Take 1 capsule daily before breakfast', '30 days', 'M005'),
('RX008', 'DX006', 30, 'Take 1 tablet daily as needed for allergies', '30 days', 'M006'),
('RX009', 'DX007', 30, 'Take 1 tablet daily in the morning', '30 days', 'M007'),
('RX010', 'DX007', 15, 'Take 1 tablet at bedtime as needed for anxiety', '15 days', 'M016'),
('RX011', 'DX008', 60, 'Take 1 tablet every 8 hours as needed for pain', '20 days', 'M014'),
('RX012', 'DX008', 30, 'Take 1 capsule three times daily', '30 days', 'M018'),
('RX013', 'DX009', 15, 'Take 1 capsule every 12 hours', '7 days', 'M003'),
('RX014', 'DX010', 1, 'Apply thin layer to affected area twice daily', '14 days', 'M012'),
('RX015', 'DX011', 30, 'Take 1 tablet daily at bedtime', '30 days', 'M010'),
('RX016', 'DX011', 60, 'Take 1 capsule daily with food', '60 days', 'M015'),
('RX017', 'DX012', 30, 'Take 1 tablet at bedtime 30 minutes before sleep', '30 days', 'M011'),
('RX018', 'DX013', 1, 'Use 2 puffs every 4-6 hours as needed', '30 days', 'M009'),
('RX019', 'DX014', 90, 'Take 1 tablet every 8 hours with food', '30 days', 'M004'),
('RX020', 'DX015', 10, 'Take 1 tablet twice daily', '5 days', 'M013'),
('RX021', 'DX016', 30, 'Take 1 tablet daily in the morning', '30 days', 'M001'),
('RX022', 'DX017', 30, 'Take 1 tablet daily, continue as prescribed', '30 days', 'M007'),
('RX023', 'DX018', 60, 'Take 1 tablet twice daily with meals', '30 days', 'M018');
