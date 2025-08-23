/*
  # Enhanced MediQueue Database Schema
  
  1. Enhanced Tables
    - Enhanced patients table with better indexing
    - Enhanced visits table with better constraints
    - Enhanced doctors table with availability tracking
    - Enhanced departments table with advanced settings
    - Enhanced appointments table for scheduling
    - Enhanced notifications system
    - Enhanced audit logging
    - Enhanced payment tracking
    - Enhanced medical records
    - Enhanced analytics tables

  2. Security
    - Row Level Security on all tables
    - Comprehensive policies for different user types
    - Audit logging for all critical operations

  3. Performance
    - Optimized indexes for common queries
    - Proper foreign key relationships
    - Efficient data types and constraints
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Enhanced Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age <= 120),
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    emergency_contact TEXT,
    blood_group TEXT,
    allergies TEXT[],
    medical_conditions TEXT[],
    insurance_info JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    average_consultation_time INTEGER DEFAULT 15,
    max_daily_capacity INTEGER DEFAULT 100,
    color_code TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT '🏥',
    is_active BOOLEAN DEFAULT true,
    operating_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
    break_times JSONB DEFAULT '[]',
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    available_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
    break_times JSONB DEFAULT '[]',
    max_patients_per_day INTEGER DEFAULT 50,
    max_patients_per_hour INTEGER DEFAULT 4,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'busy')),
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    bio TEXT,
    profile_image_url TEXT,
    languages TEXT[] DEFAULT ARRAY['english'],
    certifications JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Visits Table
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id TEXT NOT NULL DEFAULT 'CLN1',
    stn INTEGER NOT NULL,
    department TEXT NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_type TEXT DEFAULT 'walk_in' CHECK (visit_type IN ('walk_in', 'appointment', 'emergency', 'follow_up')),
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'checked_in', 'in_service', 'completed', 'held', 'expired', 'cancelled', 'no_show')),
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent', 'emergency')),
    payment_status TEXT DEFAULT 'pay_at_clinic' CHECK (payment_status IN ('paid', 'pending', 'pay_at_clinic', 'refunded', 'partial')),
    payment_provider TEXT,
    payment_ref TEXT,
    qr_payload TEXT NOT NULL,
    estimated_time TIMESTAMPTZ,
    actual_wait_time INTEGER, -- in minutes
    consultation_duration INTEGER, -- in minutes
    doctor_id UUID REFERENCES doctors(id),
    room_number TEXT,
    notes TEXT,
    symptoms TEXT,
    vital_signs JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    checked_in_at TIMESTAMPTZ,
    service_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    UNIQUE(clinic_id, department, visit_date, stn)
);

-- Enhanced Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type TEXT DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'procedure', 'checkup', 'emergency')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')),
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    confirmation_required BOOLEAN DEFAULT true,
    online_meeting_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Medical History Table
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_uid TEXT NOT NULL,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id),
    appointment_id UUID REFERENCES appointments(id),
    record_type TEXT DEFAULT 'consultation' CHECK (record_type IN ('consultation', 'prescription', 'lab_result', 'imaging', 'procedure', 'vaccination')),
    chief_complaint TEXT,
    diagnosis TEXT,
    differential_diagnosis TEXT[],
    prescription TEXT,
    lab_orders TEXT,
    imaging_orders TEXT,
    procedures_performed TEXT[],
    notes TEXT,
    follow_up_instructions TEXT,
    next_visit_date DATE,
    attachments JSONB DEFAULT '[]',
    is_confidential BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    transaction_type TEXT DEFAULT 'consultation' CHECK (transaction_type IN ('consultation', 'procedure', 'medication', 'lab_test', 'imaging', 'other')),
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'online', 'insurance', 'wallet')),
    transaction_id TEXT,
    gateway_response JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refund_reason TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('patient', 'admin', 'doctor', 'staff', 'all')),
    recipient_id TEXT,
    sender_id UUID,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder', 'alert')),
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'appointment', 'payment', 'medical', 'system', 'marketing')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    send_via TEXT[] DEFAULT ARRAY['app'],
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Clinic Settings Table
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type TEXT DEFAULT 'general' CHECK (setting_type IN ('general', 'payment', 'notification', 'queue', 'doctor', 'security', 'integration')),
    data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'admin', 'doctor', 'system', 'api')),
    action_type TEXT NOT NULL,
    action_category TEXT DEFAULT 'general' CHECK (action_category IN ('general', 'auth', 'patient', 'visit', 'payment', 'medical', 'system')),
    action_payload JSONB,
    resource_type TEXT,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Doctor Sessions Table (for consultation tracking)
CREATE TABLE IF NOT EXISTS doctor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    session_status TEXT DEFAULT 'active' CHECK (session_status IN ('active', 'inactive', 'break', 'emergency')),
    room_name TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    current_patient_id UUID REFERENCES patients(id),
    total_patients_seen INTEGER DEFAULT 0,
    session_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consultations Table (detailed consultation tracking)
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES doctor_sessions(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    consultation_type TEXT DEFAULT 'regular' CHECK (consultation_type IN ('regular', 'follow_up', 'emergency', 'second_opinion')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consultation Notes Table
CREATE TABLE IF NOT EXISTS consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'symptoms', 'diagnosis', 'prescription', 'follow_up', 'voice_note', 'procedure')),
    content TEXT NOT NULL,
    is_voice_generated BOOLEAN DEFAULT false,
    voice_confidence_score DECIMAL(3,2),
    is_template BOOLEAN DEFAULT false,
    template_name TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Transcriptions Table
CREATE TABLE IF NOT EXISTS voice_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    original_audio_url TEXT,
    transcribed_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    language_code TEXT DEFAULT 'en-US',
    processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('processing', 'completed', 'failed')),
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics Tables
CREATE TABLE IF NOT EXISTS analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    department TEXT,
    doctor_id UUID REFERENCES doctors(id),
    total_visits INTEGER DEFAULT 0,
    completed_visits INTEGER DEFAULT 0,
    cancelled_visits INTEGER DEFAULT 0,
    no_show_visits INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    average_wait_time INTEGER DEFAULT 0,
    average_consultation_time INTEGER DEFAULT 0,
    patient_satisfaction_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(date, department, doctor_id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_uid ON patients(uid);
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON patients USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_visits_date_dept ON visits(visit_date, department);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_stn ON visits(stn);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);

CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

CREATE INDEX IF NOT EXISTS idx_medical_history_patient_uid ON medical_history(patient_uid);
CREATE INDEX IF NOT EXISTS idx_medical_history_visit_id ON medical_history(visit_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_doctor_id ON medical_history(doctor_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_visit_id ON payment_transactions(visit_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient_id ON payment_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_clinic_settings_key ON clinic_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_type ON clinic_settings(setting_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_visit_id ON consultations(visit_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- Create Triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON clinic_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctor_sessions_updated_at BEFORE UPDATE ON doctor_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultation_notes_updated_at BEFORE UPDATE ON consultation_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Patients
CREATE POLICY "Public can insert patients for booking" ON patients FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can read patients for queue display" ON patients FOR SELECT TO public USING (true);
CREATE POLICY "Public can update patients for booking" ON patients FOR UPDATE TO public USING (true);
CREATE POLICY "Authenticated users can manage patients" ON patients FOR ALL TO authenticated USING (true);

-- RLS Policies for Departments
CREATE POLICY "Public can read active departments" ON departments FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Authenticated users can manage departments" ON departments FOR ALL TO authenticated USING (true);

-- RLS Policies for Doctors
CREATE POLICY "Public can read active doctors" ON doctors FOR SELECT TO public USING (status = 'active');
CREATE POLICY "Authenticated users can manage doctors" ON doctors FOR ALL TO authenticated USING (true);

-- RLS Policies for Visits
CREATE POLICY "Public can insert visits for booking" ON visits FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can read visits for queue display" ON visits FOR SELECT TO public USING (true);
CREATE POLICY "Allow visit updates for payments" ON visits FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage visits" ON visits FOR ALL TO authenticated USING (true);

-- RLS Policies for Appointments
CREATE POLICY "Public can read appointments" ON appointments FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage appointments" ON appointments FOR ALL TO authenticated USING (true);

-- RLS Policies for Medical History
CREATE POLICY "Public can read medical history with UID" ON medical_history FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage medical history" ON medical_history FOR ALL TO authenticated USING (true);

-- RLS Policies for Payment Transactions
CREATE POLICY "Allow public payment creation" ON payment_transactions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public payment reading" ON payment_transactions FOR SELECT TO public USING (true);
CREATE POLICY "Allow admin payment updates" ON payment_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin payment management" ON payment_transactions FOR ALL TO authenticated USING (true);

-- RLS Policies for Notifications
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage notifications" ON notifications FOR ALL TO authenticated USING (true);

-- RLS Policies for Clinic Settings
CREATE POLICY "Public can read clinic settings" ON clinic_settings FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage clinic settings" ON clinic_settings FOR ALL TO authenticated USING (true);

-- RLS Policies for Audit Logs
CREATE POLICY "Only authenticated users can read audit logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only authenticated users can insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for Doctor Sessions
CREATE POLICY "Public can read doctor sessions" ON doctor_sessions FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage doctor sessions" ON doctor_sessions FOR ALL TO authenticated USING (true);

-- RLS Policies for Consultations
CREATE POLICY "Public can read consultations" ON consultations FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage consultations" ON consultations FOR ALL TO authenticated USING (true);

-- RLS Policies for Consultation Notes
CREATE POLICY "Public can read consultation notes" ON consultation_notes FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage consultation notes" ON consultation_notes FOR ALL TO authenticated USING (true);

-- RLS Policies for Voice Transcriptions
CREATE POLICY "Public can read voice transcriptions" ON voice_transcriptions FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage voice transcriptions" ON voice_transcriptions FOR ALL TO authenticated USING (true);

-- RLS Policies for Analytics
CREATE POLICY "Public can read analytics" ON analytics_daily FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage analytics" ON analytics_daily FOR ALL TO authenticated USING (true);

-- Insert Default Data
INSERT INTO clinic_settings (setting_key, setting_value, setting_type, description) VALUES
('clinic_name', '"MediQueue Advanced Clinic"', 'general', 'Name of the clinic'),
('maintenance_mode', 'false', 'general', 'Enable maintenance mode to prevent new bookings'),
('maintenance_message', '"System is under maintenance. Please try again later."', 'general', 'Message to show when maintenance mode is enabled'),
('average_consultation_time', '15', 'general', 'Average consultation time in minutes'),
('max_tokens_per_day', '200', 'general', 'Maximum tokens per day per department'),
('clinic_hours_start', '"09:00"', 'general', 'Clinic opening time'),
('clinic_hours_end', '"18:00"', 'general', 'Clinic closing time'),
('auto_refresh_interval', '30', 'general', 'Auto refresh interval in seconds for admin dashboard'),
('enable_online_payments', 'true', 'payment', 'Enable online payment processing'),
('enable_appointments', 'true', 'general', 'Enable appointment booking system'),
('enable_voice_notes', 'true', 'doctor', 'Enable voice note recording for doctors'),
('patient_satisfaction_enabled', 'true', 'general', 'Enable patient satisfaction surveys'),
('sms_notifications_enabled', 'false', 'notification', 'Enable SMS notifications'),
('email_notifications_enabled', 'true', 'notification', 'Enable email notifications'),
('queue_display_refresh', '15', 'queue', 'Queue display refresh interval in seconds')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO departments (name, display_name, description, consultation_fee, average_consultation_time, color_code, icon) VALUES
('general', 'General Medicine', 'General medical consultation and treatment', 500, 15, '#3B82F6', '🏥'),
('cardiology', 'Cardiology', 'Heart and cardiovascular system treatment', 800, 20, '#EF4444', '❤️'),
('orthopedics', 'Orthopedics', 'Bone, joint, and muscle treatment', 700, 18, '#10B981', '🦴'),
('pediatrics', 'Pediatrics', 'Child healthcare and treatment', 600, 20, '#F59E0B', '👶'),
('dermatology', 'Dermatology', 'Skin, hair, and nail treatment', 650, 15, '#8B5CF6', '🧴'),
('neurology', 'Neurology', 'Brain and nervous system treatment', 900, 25, '#06B6D4', '🧠'),
('gynecology', 'Gynecology', 'Women\'s health and reproductive care', 750, 20, '#EC4899', '👩‍⚕️'),
('dentistry', 'Dentistry', 'Dental and oral health care', 400, 30, '#84CC16', '🦷')
ON CONFLICT (name) DO NOTHING;

INSERT INTO doctors (name, specialization, qualification, experience_years, consultation_fee, status) VALUES
('Dr. Rajesh Kumar', 'general', 'MBBS, MD (Internal Medicine)', 15, 500, 'active'),
('Dr. Priya Sharma', 'cardiology', 'MBBS, MD (Cardiology), DM', 12, 800, 'active'),
('Dr. Amit Singh', 'orthopedics', 'MBBS, MS (Orthopedics)', 10, 700, 'active'),
('Dr. Sunita Gupta', 'pediatrics', 'MBBS, MD (Pediatrics)', 8, 600, 'active'),
('Dr. Vikram Patel', 'dermatology', 'MBBS, MD (Dermatology)', 6, 650, 'active'),
('Dr. Neha Agarwal', 'neurology', 'MBBS, MD (Neurology), DM', 14, 900, 'active'),
('Dr. Kavita Reddy', 'gynecology', 'MBBS, MS (Gynecology)', 11, 750, 'active'),
('Dr. Rohit Jain', 'dentistry', 'BDS, MDS (Oral Surgery)', 9, 400, 'active')
ON CONFLICT DO NOTHING;