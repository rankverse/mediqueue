import React, { useState } from 'react';
import { 
  Search, 
  User, 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  Phone, 
  Mail, 
  Heart, 
  AlertTriangle,
  Activity,
  MapPin,
  Printer,
  RefreshCw,
  CreditCard,
  Stethoscope,
  Shield,
  CheckCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Patient, Visit, MedicalHistory } from '../types';
import { formatDate, formatTime, getStatusColor, getPaymentStatusColor } from '../lib/utils';

interface PatientSelfLookupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientSelfLookup: React.FC<PatientSelfLookupProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'records'>('current');
  const [error, setError] = useState<string>('');
  const [selectedPrescription, setSelectedPrescription] = useState<MedicalHistory | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const searchPatient = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter your Patient ID (UID)');
      return;
    }

    setLoading(true);
    setError('');
    setPatient(null);
    setVisits([]);
    setMedicalHistory([]);
    
    try {
      if (!isSupabaseConfigured) {
        // Demo data for testing
        const demoPatient = {
          id: '1',
          uid: searchQuery.trim().toUpperCase(),
          name: 'John Doe',
          age: 35,
          phone: '+91-9876543210',
          email: 'john.doe@email.com',
          address: '123 Main Street, City',
          emergency_contact: '+91-9876543211',
          blood_group: 'O+',
          allergies: ['Penicillin', 'Peanuts'],
          medical_conditions: ['Hypertension'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setPatient(demoPatient);
        
        const demoVisits = [
          {
            id: '1',
            patient_id: '1',
            clinic_id: 'CLN1',
            stn: 15,
            department: 'general',
            visit_date: new Date().toISOString().split('T')[0],
            status: 'waiting',
            payment_status: 'pay_at_clinic',
            payment_provider: null,
            payment_ref: null,
            qr_payload: '{}',
            estimated_time: null,
            doctor_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            checked_in_at: null,
            completed_at: null,
            patient: demoPatient,
            doctor: null,
            medical_history: [],
            payment_transactions: []
          }
        ];
        
        setVisits(demoVisits);
        
        const demoMedicalHistory = [
          {
            id: '1',
            patient_uid: searchQuery.trim().toUpperCase(),
            visit_id: '1',
            doctor_id: '1',
            diagnosis: 'Common cold with mild fever',
            prescription: `1. Paracetamol 500mg - Take twice daily after meals for 3 days
2. Cetirizine 10mg - Take once daily at bedtime for 5 days
3. Vitamin C tablets - Take once daily for 7 days

Instructions:
- Rest and drink plenty of fluids
- Avoid cold foods and drinks
- Return if symptoms worsen`,
            notes: 'Patient presented with mild cold symptoms. Advised rest and medication.',
            attachments: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            doctor: {
              id: '1',
              name: 'Dr. Sarah Johnson',
              specialization: 'general',
              qualification: 'MBBS, MD',
              experience_years: 10,
              consultation_fee: 500,
              available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
              available_hours: { start: '09:00', end: '17:00' },
              max_patients_per_day: 50,
              status: 'active',
              created_at: '',
              updated_at: ''
            }
          }
        ];
        
        setMedicalHistory(demoMedicalHistory);
        return;
      }

      // Search by UID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('uid', searchQuery.trim().toUpperCase())
        .single();

      if (patientError || !patientData) {
        setError('Patient not found. Please check your Patient ID (UID) and try again.');
        return;
      }

      setPatient(patientData);

      // Fetch all visits for this patient
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select(`
          *,
          doctor:doctors(*),
          payment_transactions(*)
        `)
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false });

      if (visitsError) throw visitsError;
      setVisits(visitsData || []);

      // Fetch medical history
      const { data: historyData, error: historyError } = await supabase
        .from('medical_history')
        .select(`
          *,
          doctor:doctors(*),
          visit:visits(*)
        `)
        .eq('patient_uid', patientData.uid)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;
      setMedicalHistory(historyData || []);

    } catch (error) {
      console.error('Error searching patient:', error);
      setError('Error searching patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPrescription = (prescription: MedicalHistory) => {
    const prescriptionContent = `
MEDIQUEUE CLINIC
Professional Healthcare Services
Digital Prescription

Generated on: ${formatDate(new Date().toISOString())}
Time: ${formatTime(new Date().toISOString())}

═══════════════════════════════════════════════════════════

PATIENT INFORMATION:
Name: ${patient?.name}
Age: ${patient?.age} years
Patient ID: ${patient?.uid}
Phone: ${patient?.phone}
${patient?.email ? `Email: ${patient.email}` : ''}
${patient?.blood_group ? `Blood Group: ${patient.blood_group}` : ''}

CONSULTATION DETAILS:
Date: ${formatDate(prescription.created_at)}
Time: ${formatTime(prescription.created_at)}
Doctor: ${prescription.doctor?.name || 'N/A'}
Specialization: ${prescription.doctor?.specialization || 'N/A'}
${prescription.doctor?.qualification ? `Qualification: ${prescription.doctor.qualification}` : ''}

═══════════════════════════════════════════════════════════

DIAGNOSIS:
${prescription.diagnosis || 'Not specified'}

PRESCRIPTION:
${prescription.prescription || 'No prescription provided'}

ADDITIONAL NOTES:
${prescription.notes || 'No additional notes'}

═══════════════════════════════════════════════════════════

IMPORTANT INSTRUCTIONS:
• Follow the prescribed dosage strictly
• Complete the full course of medication
• Contact the clinic if you experience any side effects
• Keep this prescription for your records

For any queries or emergencies, please contact:
MediQueue Clinic
Phone: +91-XXXX-XXXX-XX
Email: info@mediqueue.com

This is a digitally generated prescription.
Prescription ID: ${prescription.id}
    `.trim();

    const blob = new Blob([prescriptionContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prescription-${patient?.name}-${formatDate(prescription.created_at)}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const printPrescription = (prescription: MedicalHistory) => {
    const printContent = `
      <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 30px; line-height: 1.6; color: #333;">
        <div style="text-align: center; border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 32px; font-weight: bold;">MEDIQUEUE CLINIC</h1>
          <p style="margin: 5px 0; color: #666; font-size: 16px; font-style: italic;">Professional Healthcare Services</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Digital Prescription</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Generated: ${formatDate(new Date().toISOString())} at ${formatTime(new Date().toISOString())}</p>
        </div>
        
        <div style="margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">PATIENT INFORMATION</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 8px 0;"><strong>Name:</strong> ${patient?.name}</p>
              <p style="margin: 8px 0;"><strong>Age:</strong> ${patient?.age} years</p>
              <p style="margin: 8px 0;"><strong>Patient ID:</strong> ${patient?.uid}</p>
              <p style="margin: 8px 0;"><strong>Phone:</strong> ${patient?.phone}</p>
            </div>
            <div>
              ${patient?.email ? `<p style="margin: 8px 0;"><strong>Email:</strong> ${patient.email}</p>` : ''}
              ${patient?.blood_group ? `<p style="margin: 8px 0;"><strong>Blood Group:</strong> ${patient.blood_group}</p>` : ''}
              ${patient?.emergency_contact ? `<p style="margin: 8px 0;"><strong>Emergency Contact:</strong> ${patient.emergency_contact}</p>` : ''}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px; background: #f0f9ff; padding: 20px; border-radius: 8px; border: 1px solid #bae6fd;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">CONSULTATION DETAILS</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(prescription.created_at)}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTime(prescription.created_at)}</p>
            </div>
            <div>
              <p style="margin: 8px 0;"><strong>Doctor:</strong> ${prescription.doctor?.name || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Specialization:</strong> ${prescription.doctor?.specialization || 'N/A'}</p>
              ${prescription.doctor?.qualification ? `<p style="margin: 8px 0;"><strong>Qualification:</strong> ${prescription.doctor.qualification}</p>` : ''}
            </div>
          </div>
        </div>

        ${prescription.diagnosis ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">DIAGNOSIS</h3>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">${prescription.diagnosis}</p>
          </div>
        </div>
        ` : ''}

        ${prescription.prescription ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">PRESCRIPTION</h3>
          <div style="background: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #16a34a;">
            <pre style="margin: 0; font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${prescription.prescription}</pre>
          </div>
        </div>
        ` : ''}

        ${prescription.notes ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">ADDITIONAL NOTES</h3>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #6b7280;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">${prescription.notes}</p>
          </div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
          <h4 style="color: #dc2626; margin-bottom: 10px; font-size: 16px;">IMPORTANT INSTRUCTIONS:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
            <li>Follow the prescribed dosage strictly</li>
            <li>Complete the full course of medication</li>
            <li>Contact the clinic if you experience any side effects</li>
            <li>Keep this prescription for your records</li>
            <li>Do not share medications with others</li>
          </ul>
        </div>

        <div style="margin-top: 40px; text-align: center; border-top: 2px solid #e5e7eb; padding-top: 20px;">
          <p style="margin: 5px 0; font-size: 18px;"><strong>Dr. ${prescription.doctor?.name || 'N/A'}</strong></p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">${prescription.doctor?.qualification || ''}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">${prescription.doctor?.specialization || ''}</p>
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 5px 0; font-size: 12px; color: #666;">MediQueue Clinic | Professional Healthcare Services</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">This is a digitally generated prescription</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">Prescription ID: ${prescription.id}</p>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Prescription - ${patient?.name}</title>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
              @page {
                margin: 1in;
                size: A4;
              }
            </style>
          </head>
          <body>
            ${printContent}
            <div class="no-print" style="text-align: center; margin-top: 30px; padding: 20px; border-top: 2px solid #e5e7eb;">
              <button onclick="window.print()" style="padding: 12px 24px; background: #0d9488; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 14px;">Print Prescription</button>
              <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setPatient(null);
    setVisits([]);
    setMedicalHistory([]);
    setActiveTab('current');
    setError('');
    onClose();
  };

  const refreshData = () => {
    if (patient) {
      searchPatient();
    }
  };

  const todaysVisit = visits.find(v => {
    const today = new Date().toISOString().split('T')[0];
    return v.visit_date === today;
  });

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Track Your Appointment" size="xl">
        <div className="space-y-6">
          {/* Search Section */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h4 className="font-semibold text-teal-900 mb-3 flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Enter Your Patient ID
            </h4>
            <div className="flex space-x-3">
              <Input
                placeholder="Enter your Patient ID (e.g., CLN1-ABC123)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPatient()}
                className="flex-1 font-mono"
                error={error}
              />
              <Button onClick={searchPatient} loading={loading} className="bg-teal-600 hover:bg-teal-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <p className="text-teal-700 text-sm mt-2">
              💡 Your Patient ID was provided when you first booked an appointment
            </p>
          </div>

          {patient && (
            <div className="space-y-6">
              {/* Patient Overview */}
              <Card className="border border-gray-200">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
                        <p className="text-gray-600">Patient ID: {patient.uid}</p>
                      </div>
                    </div>
                    <Button onClick={refreshData} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{patient.age} years old</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{patient.phone}</span>
                        </div>
                        {patient.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{patient.email}</span>
                          </div>
                        )}
                        {patient.address && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{patient.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Health Info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Health Information</h4>
                      {patient.blood_group && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                          <span className="text-sm font-medium text-red-800 flex items-center">
                            <Heart className="h-4 w-4 mr-2" />
                            Blood Group: {patient.blood_group}
                          </span>
                        </div>
                      )}

                      {patient.allergies && patient.allergies.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                          <div className="flex items-center mb-1">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">Allergies:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {patient.allergies.map((allergy, index) => (
                              <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <div className="flex items-center mb-1">
                            <Activity className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-blue-800">Conditions:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {patient.medical_conditions.map((condition, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Statistics</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-teal-50 rounded-lg p-2 text-center border border-teal-200">
                          <div className="text-lg font-bold text-teal-600">{visits.length}</div>
                          <div className="text-xs text-teal-700">Total Visits</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                          <div className="text-lg font-bold text-green-600">
                            {visits.filter(v => v.status === 'completed').length}
                          </div>
                          <div className="text-xs text-green-700">Completed</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-200">
                          <div className="text-lg font-bold text-purple-600">{medicalHistory.length}</div>
                          <div className="text-xs text-purple-700">Records</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-200">
                          <div className="text-lg font-bold text-orange-600">
                            {formatDate(patient.created_at).split(',')[0]}
                          </div>
                          <div className="text-xs text-orange-700">Member Since</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Appointment */}
              {todaysVisit && (
                <Card className="border-l-4 border-teal-500 bg-teal-50">
                  <CardHeader>
                    <h4 className="font-semibold text-teal-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Today's Appointment
                    </h4>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Token Number</p>
                        <p className="text-2xl font-bold text-teal-600">#{todaysVisit.stn}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-semibold text-gray-900 capitalize">{todaysVisit.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(todaysVisit.status)}`}>
                          {todaysVisit.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { key: 'current', label: 'Current Visits', icon: Calendar, count: visits.filter(v => ['waiting', 'checked_in', 'in_service'].includes(v.status)).length },
                    { key: 'history', label: 'Visit History', icon: Clock, count: visits.length },
                    { key: 'records', label: 'Medical Records', icon: FileText, count: medicalHistory.length }
                  ].map(({ key, label, icon: Icon, count }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                        activeTab === key
                          ? 'border-teal-500 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label} ({count})
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="max-h-96 overflow-y-auto">
                {activeTab === 'current' && (
                  <div className="space-y-4">
                    {visits.filter(v => ['waiting', 'checked_in', 'in_service'].includes(v.status)).map((visit) => (
                      <Card key={visit.id} className="border border-gray-200">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Token #{visit.stn} - {visit.department.charAt(0).toUpperCase() + visit.department.slice(1)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formatDate(visit.visit_date)} at {formatTime(visit.created_at)}
                              </p>
                              {visit.doctor && (
                                <p className="text-sm text-gray-600 flex items-center">
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  Dr. {visit.doctor.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right space-y-1">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(visit.status)}`}>
                                {visit.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <br />
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(visit.payment_status)}`}>
                                {visit.payment_status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {visit.status === 'waiting' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-yellow-800 text-sm font-medium">
                                ⏳ Please wait for your turn. Monitor the queue status above.
                              </p>
                            </div>
                          )}

                          {visit.status === 'checked_in' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-blue-800 text-sm font-medium">
                                ✅ You're checked in! Please wait in the designated area.
                              </p>
                            </div>
                          )}

                          {visit.status === 'in_service' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-green-800 text-sm font-medium">
                                🏥 Your consultation is in progress.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {visits.filter(v => ['waiting', 'checked_in', 'in_service'].includes(v.status)).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p>No current appointments found.</p>
                        <Button 
                          onClick={() => {
                            handleClose();
                            // This would trigger the booking modal on the parent component
                          }}
                          className="mt-4 bg-teal-600 hover:bg-teal-700"
                        >
                          Book New Appointment
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4">
                    {visits.map((visit) => (
                      <Card key={visit.id} className="border border-gray-200">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Token #{visit.stn} - {visit.department.charAt(0).toUpperCase() + visit.department.slice(1)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formatDate(visit.visit_date)} at {formatTime(visit.created_at)}
                              </p>
                              {visit.doctor && (
                                <p className="text-sm text-gray-600 flex items-center">
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  Dr. {visit.doctor.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right space-y-1">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(visit.status)}`}>
                                {visit.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <br />
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(visit.payment_status)}`}>
                                {visit.payment_status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {visit.payment_transactions && visit.payment_transactions.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Payment:
                                </span>
                                <span className="font-medium text-green-600">
                                  ₹{visit.payment_transactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {visits.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p>No visit history found.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'records' && (
                  <div className="space-y-4">
                    {medicalHistory.map((record) => (
                      <Card key={record.id} className="border border-gray-200">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Medical Record - {formatDate(record.created_at)}
                              </h4>
                              {record.doctor && (
                                <p className="text-sm text-gray-600 flex items-center">
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  Dr. {record.doctor.name} - {record.doctor.specialization}
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPrescription(record);
                                  setShowPrescriptionModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadPrescription(record)}
                                className="bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => printPrescription(record)}
                              >
                                <Printer className="h-4 w-4 mr-1" />
                                Print
                              </Button>
                            </div>
                          </div>

                          {record.diagnosis && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-900">Diagnosis: </span>
                              <span className="text-sm text-gray-700">{record.diagnosis}</span>
                            </div>
                          )}

                          {record.prescription && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                              <span className="text-sm font-medium text-green-800 flex items-center">
                                <Shield className="h-4 w-4 mr-2" />
                                Prescription Available
                              </span>
                              <p className="text-xs text-green-700 mt-1">Click "View", "Download" or "Print" to access full prescription</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {medicalHistory.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p>No medical records found.</p>
                        <p className="text-sm mt-2">Medical records will appear here after your consultations.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Prescription Detail Modal */}
      <Modal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        title="Prescription Details"
        size="lg"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h4 className="font-semibold text-teal-900 mb-2 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Consultation Information
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Date:</strong> {formatDate(selectedPrescription.created_at)}</p>
                  <p><strong>Time:</strong> {formatTime(selectedPrescription.created_at)}</p>
                </div>
                <div>
                  <p><strong>Doctor:</strong> {selectedPrescription.doctor?.name || 'N/A'}</p>
                  <p><strong>Specialization:</strong> {selectedPrescription.doctor?.specialization || 'N/A'}</p>
                </div>
              </div>
            </div>

            {selectedPrescription.diagnosis && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Diagnosis</h5>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-gray-800">{selectedPrescription.diagnosis}</p>
                </div>
              </div>
            )}

            {selectedPrescription.prescription && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Prescription</h5>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <pre className="text-gray-800 whitespace-pre-wrap font-sans">{selectedPrescription.prescription}</pre>
                </div>
              </div>
            )}

            {selectedPrescription.notes && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Additional Notes</h5>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-gray-800">{selectedPrescription.notes}</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>This prescription is digitally verified and secure</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPrescriptionModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => downloadPrescription(selectedPrescription)}
                variant="outline"
                className="flex-1 bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => printPrescription(selectedPrescription)}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};