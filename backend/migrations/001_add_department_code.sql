ALTER TABLE departments
    ADD COLUMN code VARCHAR(20) NULL AFTER id;

UPDATE departments
SET code = CONCAT('DEP-', LPAD(id, 3, '0'))
WHERE code IS NULL;

ALTER TABLE departments
    MODIFY code VARCHAR(20) NOT NULL,
    ADD UNIQUE KEY uq_departments_code (code);
