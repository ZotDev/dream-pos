CREATE TABLE IF NOT EXISTS attendance_records (
 id BIGSERIAL PRIMARY KEY,
 employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
 attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
 clock_in TIMESTAMPTZ,
 clock_out TIMESTAMPTZ,
 status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','half_day','leave')),
 notes TEXT,
 recorded_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(employee_id,attendance_date),
 CHECK(clock_out IS NULL OR clock_in IS NULL OR clock_out>=clock_in)
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date DESC);
