
-- Clear existing series 1-4 events and reinsert per updated PDF almanac
DELETE FROM public.almanac_events WHERE series_number IN (1,2,3,4);

INSERT INTO public.almanac_events (series_number, event_date, event_start_date, event_end_date, event_name, responsible_person, description, is_published) VALUES
-- Series 1
(1, '2026-07-20', '2026-07-20', '2026-07-23', 'Exam setting begins', 'Subject Coordinators', 'Setting of examination papers', true),
(1, '2026-07-24', '2026-07-24', '2026-07-24', 'Submission to coordinator', 'Subject Coordinators', 'Submission of composed exams to the coordinator', true),
(1, '2026-07-28', '2026-07-28', '2026-07-28', 'Exams issued to teachers', 'Distribution Team', 'Distribution of exams to participating teachers', true),
(1, '2026-07-29', '2026-07-29', '2026-07-30', 'Examination day', 'Schools & Invigilators', 'Sitting of the examination (Papers 1 & 2)', true),
(1, '2026-07-31', '2026-07-31', '2026-08-09', 'Marking and Results preparation', 'Marking Team & IT', 'Marking of scripts and preparation of results', true),
(1, '2026-08-09', '2026-08-09', '2026-08-23', 'Correction and preparation for Next series', 'TASSA Secretariat', 'Corrections and preparation for the next series', true),

-- Series 2
(2, '2026-08-17', '2026-08-17', '2026-08-20', 'Exam setting begins', 'Subject Coordinators', 'Setting of examination papers', true),
(2, '2026-08-21', '2026-08-21', '2026-08-21', 'Submission to coordinator', 'Subject Coordinators', 'Submission of composed exams to the coordinator', true),
(2, '2026-08-23', '2026-08-23', '2026-08-23', 'Exams issued to teachers', 'Distribution Team', 'Distribution of exams to participating teachers', true),
(2, '2026-08-24', '2026-08-24', '2026-08-25', 'Examination day', 'Schools & Invigilators', 'Sitting of the examination (Papers 1 & 2)', true),
(2, '2026-08-26', '2026-08-26', '2026-09-03', 'Marking and Results preparation', 'Marking Team & IT', 'Marking of scripts and preparation of results', true),
(2, '2026-09-04', '2026-09-04', '2026-09-13', 'Correction and preparation for Next series', 'TASSA Secretariat', 'Corrections and preparation for the next series', true),

-- Series 3
(3, '2026-09-14', '2026-09-14', '2026-09-17', 'Exam setting begins', 'Subject Coordinators', 'Setting of examination papers', true),
(3, '2026-09-18', '2026-09-18', '2026-09-18', 'Submission to coordinator', 'Subject Coordinators', 'Submission of composed exams to the coordinator', true),
(3, '2026-09-20', '2026-09-20', '2026-09-20', 'Exams issued to teachers', 'Distribution Team', 'Distribution of exams to participating teachers', true),
(3, '2026-09-21', '2026-09-21', '2026-09-22', 'Examination day', 'Schools & Invigilators', 'Sitting of the examination (Papers 1 & 2)', true),
(3, '2026-09-23', '2026-09-23', '2026-10-01', 'Marking and Results preparation', 'Marking Team & IT', 'Marking of scripts and preparation of results', true),
(3, '2026-10-02', '2026-10-02', '2026-10-18', 'Correction and preparation for Next series', 'TASSA Secretariat', 'Corrections and preparation for the next series', true),

-- Series 4
(4, '2026-10-12', '2026-10-12', '2026-10-15', 'Exam setting begins', 'Subject Coordinators', 'Setting of examination papers', true),
(4, '2026-10-16', '2026-10-16', '2026-10-16', 'Submission to coordinator', 'Subject Coordinators', 'Submission of composed exams to the coordinator', true),
(4, '2026-10-18', '2026-10-18', '2026-10-18', 'Exams issued to teachers', 'Distribution Team', 'Distribution of exams to participating teachers', true),
(4, '2026-10-19', '2026-10-19', '2026-10-20', 'Examination day', 'Schools & Invigilators', 'Sitting of the examination (Papers 1 & 2)', true),
(4, '2026-10-21', '2026-10-21', '2026-10-29', 'Marking and Results preparation', 'Marking Team & IT', 'Marking of scripts and preparation of results', true),
(4, '2026-10-30', '2026-10-30', '2026-11-13', 'Correction and preparation for Next series', 'TASSA Secretariat', 'Corrections and preparation for the next series', true);
