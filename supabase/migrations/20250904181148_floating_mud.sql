/*
  # Advanced Medical System Features

  1. New Tables
    - `appointments` - Scheduled appointments with time slots
    - `daycare_bookings` - Day care facility bookings
    - `admission_records` - Patient admission management
    - `medicines` - Pharmacy inventory management
    - `pharmacy_bills` - Pharmacy billing and sales
    - `room_management` - Hospital room and bed management

  2. Enhanced Features
    - Appointment scheduling system
    - Day care facility management
    - Patient admission workflow
    - Pharmacy management system
    - Room and bed allocation
    - Advanced billing system

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for different user roles
*/

-- Appointments table for scheduled appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  appointment_type text DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'check_up', 'procedure', 'vaccination')),
  duration_minutes integer DEFAULT 30,
  priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Day care bookings table
CREATE TABLE IF NOT EXISTS daycare_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  daycare_type text NOT NULL CHECK (daycare_type IN ('observation', 'recovery', 'dialysis', 'chemotherapy', 'physiotherapy')),
  booking_date date NOT NULL,
  duration_hours integer DEFAULT 8,
  special_requirements text,
  attendant_required boolean DEFAULT false,
  meal_preferences text,
  total_cost numeric(10,2) DEFAULT 0,
  advance_payment numeric(10,2) DEFAULT 0,
  status text DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admission records table
CREATE TABLE IF NOT EXISTS admission_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  admission_type text NOT NULL CHECK (admission_type IN ('emergency', 'planned', 'observation', 'surgery')),
  ward_type text NOT NULL CHECK (ward_type IN ('general', 'private', 'icu', 'semi_private')),
  room_id text,
  admission_date timestamptz DEFAULT now(),
  discharge_date timestamptz,
  estimated_duration integer DEFAULT 1,
  actual_duration integer,
  reason text NOT NULL,
  special_requirements text,
  insurance_details text,
  total_estimated_cost numeric(10,2) DEFAULT 0,
  final_bill_amount numeric(10,2),
  advance_payment numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'admitted', 'discharged')),
  paperwork_completed jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medicines inventory table
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text NOT NULL,
  manufacturer text NOT NULL,
  batch_number text NOT NULL,
  expiry_date date NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'tablet',
  category text NOT NULL,
  prescription_required boolean DEFAULT true,
  description text,
  side_effects text,
  storage_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pharmacy bills table
CREATE TABLE IF NOT EXISTS pharmacy_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  prescription_id uuid REFERENCES medical_history(id),
  bill_number text UNIQUE NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_percentage numeric(5,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  tax_percentage numeric(5,2) DEFAULT 5,
  tax_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'insurance', 'bank_transfer')),
  processed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Room management table
CREATE TABLE IF NOT EXISTS room_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text UNIQUE NOT NULL,
  room_type text NOT NULL CHECK (room_type IN ('general', 'private', 'icu', 'semi_private', 'operation_theater', 'emergency')),
  floor_number integer NOT NULL,
  bed_count integer DEFAULT 1,
  daily_rate numeric(10,2) NOT NULL DEFAULT 0,
  amenities jsonb DEFAULT '[]',
  is_available boolean DEFAULT true,
  current_patient_id uuid REFERENCES patients(id),
  last_cleaned_at timestamptz,
  maintenance_status text DEFAULT 'operational' CHECK (maintenance_status IN ('operational', 'maintenance', 'out_of_service')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointment slots table for better scheduling
CREATE TABLE IF NOT EXISTS appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  slot_time time NOT NULL,
  duration_minutes integer DEFAULT 15,
  is_available boolean DEFAULT true,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, slot_date, slot_time)
);

-- Service packages table
CREATE TABLE IF NOT EXISTS service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL,
  package_type text NOT NULL CHECK (package_type IN ('health_checkup', 'diagnostic', 'treatment', 'surgery', 'daycare')),
  description text,
  included_services jsonb DEFAULT '[]',
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  duration_hours integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_daycare_bookings_date ON daycare_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_admission_records_patient_id ON admission_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_pharmacy_bills_patient_id ON pharmacy_bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_room_management_type ON room_management(room_type);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_doctor_date ON appointment_slots(doctor_id, slot_date);

-- Enable RLS on all new tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daycare_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Authenticated users can manage appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public can read appointments"
  ON appointments
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for daycare bookings
CREATE POLICY "Authenticated users can manage daycare bookings"
  ON daycare_bookings
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public can read daycare bookings"
  ON daycare_bookings
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for admission records
CREATE POLICY "Authenticated users can manage admissions"
  ON admission_records
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public can read admissions"
  ON admission_records
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for medicines
CREATE POLICY "Authenticated users can manage medicines"
  ON medicines
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public can read medicines"
  ON medicines
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for pharmacy bills
CREATE POLICY "Authenticated users can manage pharmacy bills"
  ON pharmacy_bills
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public can read pharmacy bills"
  ON pharmacy_bills
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for room management
CREATE POLICY "Authenticated users can manage rooms"
  ON room_management
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public can read room availability"
  ON room_management
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for appointment slots
CREATE POLICY "Authenticated users can manage appointment slots"
  ON appointment_slots
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public can read appointment slots"
  ON appointment_slots
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for service packages
CREATE POLICY "Authenticated users can manage service packages"
  ON service_packages
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public can read service packages"
  ON service_packages
  FOR SELECT
  TO public
  USING (true);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daycare_bookings_updated_at BEFORE UPDATE ON daycare_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admission_records_updated_at BEFORE UPDATE ON admission_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacy_bills_updated_at BEFORE UPDATE ON pharmacy_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_room_management_updated_at BEFORE UPDATE ON room_management FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_packages_updated_at BEFORE UPDATE ON service_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default service packages
INSERT INTO service_packages (package_name, package_type, description, included_services, base_price, duration_hours) VALUES
('Basic Health Checkup', 'health_checkup', 'Complete basic health screening', '["Blood Test", "ECG", "Chest X-Ray", "General Consultation"]', 2500, 2),
('Comprehensive Health Checkup', 'health_checkup', 'Detailed health assessment', '["Complete Blood Count", "Lipid Profile", "Liver Function", "Kidney Function", "ECG", "Echo", "Ultrasound", "Specialist Consultation"]', 5000, 4),
('Cardiac Package', 'diagnostic', 'Complete heart health assessment', '["ECG", "Echo", "Stress Test", "Cardiac Consultation"]', 3500, 3),
('Diabetes Package', 'diagnostic', 'Diabetes monitoring and management', '["HbA1c", "Fasting Glucose", "Post Meal Glucose", "Diabetic Consultation"]', 1500, 1),
('Pre-Surgery Package', 'diagnostic', 'Pre-operative assessment', '["Complete Blood Count", "Coagulation Profile", "ECG", "Chest X-Ray", "Anesthesia Consultation"]', 2000, 2);

-- Insert default medicines
INSERT INTO medicines (name, generic_name, manufacturer, batch_number, expiry_date, price, stock_quantity, unit, category, prescription_required) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'ABC Pharma', 'PAR001', '2025-12-31', 2.50, 500, 'tablet', 'analgesic', false),
('Amoxicillin 250mg', 'Amoxicillin', 'XYZ Pharma', 'AMX001', '2025-10-15', 5.00, 200, 'capsule', 'antibiotic', true),
('Cetirizine 10mg', 'Cetirizine', 'DEF Pharma', 'CET001', '2025-11-30', 1.50, 300, 'tablet', 'antihistamine', false),
('Omeprazole 20mg', 'Omeprazole', 'GHI Pharma', 'OME001', '2025-09-20', 3.00, 150, 'capsule', 'proton_pump_inhibitor', true),
('Aspirin 75mg', 'Acetylsalicylic Acid', 'JKL Pharma', 'ASP001', '2025-08-15', 1.00, 400, 'tablet', 'antiplatelet', false);

-- Insert default rooms
INSERT INTO room_management (room_number, room_type, floor_number, bed_count, daily_rate, amenities, is_available) VALUES
('G101', 'general', 1, 4, 1500, '["Shared Bathroom", "Basic Amenities"]', true),
('G102', 'general', 1, 4, 1500, '["Shared Bathroom", "Basic Amenities"]', true),
('P201', 'private', 2, 1, 3000, '["Private Bathroom", "AC", "TV", "Refrigerator"]', true),
('P202', 'private', 2, 1, 3000, '["Private Bathroom", "AC", "TV", "Refrigerator"]', false),
('SP301', 'semi_private', 3, 2, 2000, '["Shared Bathroom", "AC", "TV"]', true),
('ICU401', 'icu', 4, 1, 5000, '["Ventilator", "Cardiac Monitor", "24x7 Nursing"]', true),
('ICU402', 'icu', 4, 1, 5000, '["Ventilator", "Cardiac Monitor", "24x7 Nursing"]', true),
('OT501', 'operation_theater', 5, 1, 10000, '["Surgical Equipment", "Anesthesia", "Sterile Environment"]', true);

-- Add new settings for advanced features
INSERT INTO clinic_settings (setting_key, setting_value, setting_type, description) VALUES
('max_appointments_per_day', 100, 'general', 'Maximum appointments allowed per day'),
('appointment_slot_duration', 15, 'general', 'Default appointment slot duration in minutes'),
('advance_booking_limit_days', 30, 'general', 'Maximum days in advance for booking appointments'),
('daycare_base_rate', 2000, 'general', 'Base rate for day care services per day'),
('admission_advance_percentage', 50, 'general', 'Minimum advance payment percentage for admissions'),
('pharmacy_tax_rate', 5, 'payment', 'Tax rate for pharmacy sales'),
('pharmacy_max_discount', 20, 'payment', 'Maximum discount percentage for pharmacy'),
('low_stock_alert_threshold', 10, 'general', 'Alert when medicine stock falls below this number'),
('enable_appointment_scheduling', true, 'general', 'Enable appointment scheduling feature'),
('enable_daycare_booking', true, 'general', 'Enable day care facility booking'),
('enable_admission_management', true, 'general', 'Enable patient admission management'),
('enable_pharmacy_module', true, 'general', 'Enable pharmacy management module')
ON CONFLICT (setting_key) DO NOTHING;