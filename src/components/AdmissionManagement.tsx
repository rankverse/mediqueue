import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  CreditCard, 
  CheckSquare, 
  AlertTriangle,
  Stethoscope,
  Clipboard,
  Phone,
  Mail,
  Heart,
  Activity,
  Building2,
  DollarSign,
  Shield,
  UserCheck
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../lib/utils';

interface AdmissionManagementProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  visitId?: string;
  doctorRecommendation?: any;
}

interface AdmissionRequest {
  patient_id: string;
  visit_id: string;
  doctor_id: string;
  admission_type: 'emergency' | 'planned' | 'observation' | 'surgery';
  ward_type: 'general' | 'private' | 'icu' | 'semi_private';
  room_id: string;
  estimated_duration: number;
  reason: string;
  special_requirements: string;
  insurance_details: string;
  total_estimated_cost: number;
  advance_payment: number;
  status: 'pending' | 'approved' | 'admitted' | 'discharged';
}

interface AdmissionPaperwork {
  consent_form: boolean;
  insurance_verification: boolean;
  medical_history_review: boolean;
  allergy_check: boolean;
  emergency_contact_verified: boolean;
  advance_payment_received: boolean;
  room_assignment: boolean;
  doctor_briefing: boolean;
}

interface Room {
  id: string;
  room_number: string;
  room_type: 'general' | 'private' | 'icu' | 'semi_private';
  floor_number: number;
  bed_count: number;
  daily_rate: number;
  amenities: string[];
  current_patient_id?: string;
  maintenance_status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  last_cleaned: string;
}

export const AdmissionManagement: React.FC<AdmissionManagementProps> = ({
  isOpen,
  onClose,
  patientId,
  visitId,
  doctorRecommendation
}) => {
  const [admissionData, setAdmissionData] = useState<Partial<AdmissionRequest>>({
    admission_type: 'planned',
    ward_type: 'general',
    estimated_duration: 1,
    advance_payment: 0,
    status: 'pending'
  });

  const [paperwork, setPaperwork] = useState<AdmissionPaperwork>({
    consent_form: false,
    insurance_verification: false,
    medical_history_review: false,
    allergy_check: false,
    emergency_contact_verified: false,
    advance_payment_received: false,
    room_assignment: false,
    doctor_briefing: false
  });

  const [patient, setPatient] = useState<any>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(4);
  const [admissionRequests, setAdmissionRequests] = useState<any[]>([]);
  const [showRequestsView, setShowRequestsView] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (patientId) {
        fetchPatientDetails();
      }
      fetchAvailableRooms();
      fetchAdmissionRequests();
    }
  }, [isOpen, patientId]);

  const fetchPatientDetails = async () => {
    try {
      // Demo patient data
      const demoPatient = {
        id: patientId,
        uid: 'CLN1-ABC123',
        name: 'John Doe',
        age: 35,
        phone: '+91-9876543210',
        email: 'john.doe@email.com',
        blood_group: 'O+',
        allergies: ['Penicillin'],
        medical_conditions: ['Hypertension'],
        emergency_contact: '+91-9876543211'
      };
      
      setPatient(demoPatient);
    } catch (error) {
      console.error('Error fetching patient:', error);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const demoRooms: Room[] = [
        {
          id: 'R101',
          room_number: '101',
          room_type: 'general',
          floor_number: 1,
          bed_count: 4,
          daily_rate: 1500,
          amenities: ['AC', 'TV', 'Attached Bathroom'],
          maintenance_status: 'available',
          last_cleaned: new Date().toISOString()
        },
        {
          id: 'R201',
          room_number: '201',
          room_type: 'private',
          floor_number: 2,
          bed_count: 1,
          daily_rate: 3000,
          amenities: ['AC', 'TV', 'Attached Bathroom', 'Refrigerator', 'Sofa'],
          maintenance_status: 'available',
          last_cleaned: new Date().toISOString()
        },
        {
          id: 'R301',
          room_number: '301',
          room_type: 'semi_private',
          floor_number: 3,
          bed_count: 2,
          daily_rate: 2000,
          amenities: ['AC', 'TV', 'Attached Bathroom'],
          current_patient_id: 'patient-123',
          maintenance_status: 'occupied',
          last_cleaned: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'ICU1',
          room_number: 'ICU-1',
          room_type: 'icu',
          floor_number: 4,
          bed_count: 1,
          daily_rate: 5000,
          amenities: ['Ventilator', 'Cardiac Monitor', 'Defibrillator', 'Central AC'],
          maintenance_status: 'available',
          last_cleaned: new Date().toISOString()
        }
      ];
      
      setAvailableRooms(demoRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchAdmissionRequests = async () => {
    try {
      const demoRequests = [
        {
          id: '1',
          patient: {
            name: 'John Doe',
            uid: 'CLN1-ABC123',
            age: 35,
            phone: '+91-9876543210'
          },
          doctor: {
            name: 'Dr. Sarah Johnson',
            specialization: 'general'
          },
          admission_type: 'planned',
          ward_type: 'private',
          reason: 'Requires observation for chest pain',
          estimated_duration: 2,
          estimated_cost: 6000,
          status: 'pending',
          created_at: new Date().toISOString(),
          priority: 'normal'
        },
        {
          id: '2',
          patient: {
            name: 'Jane Smith',
            uid: 'CLN1-XYZ789',
            age: 28,
            phone: '+91-9876543211'
          },
          doctor: {
            name: 'Dr. Michael Chen',
            specialization: 'cardiology'
          },
          admission_type: 'emergency',
          ward_type: 'icu',
          reason: 'Acute myocardial infarction',
          estimated_duration: 5,
          estimated_cost: 25000,
          status: 'pending',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          priority: 'urgent'
        }
      ];
      
      setAdmissionRequests(demoRequests);
    } catch (error) {
      console.error('Error fetching admission requests:', error);
    }
  };

  const calculateEstimatedCost = () => {
    const room = availableRooms.find(r => r.id === selectedRoom);
    const roomCost = room ? room.daily_rate * (admissionData.estimated_duration || 1) : 0;
    const doctorFees = 1000; // Base doctor fees
    const nursingCare = 500 * (admissionData.estimated_duration || 1);
    const miscCharges = 300;
    
    return roomCost + doctorFees + nursingCare + miscCharges;
  };

  const handlePaperworkChange = (field: keyof AdmissionPaperwork, value: boolean) => {
    setPaperwork(prev => ({ ...prev, [field]: value }));
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1: // Patient & Admission Details
        return admissionData.admission_type && admissionData.ward_type && admissionData.reason;
      case 2: // Room Assignment
        return selectedRoom;
      case 3: // Paperwork
        return Object.values(paperwork).every(Boolean);
      case 4: // Payment
        return admissionData.advance_payment && admissionData.advance_payment > 0;
      default:
        return false;
    }
  };

  const processAdmission = async () => {
    setLoading(true);
    try {
      const admissionRecord = {
        ...admissionData,
        patient_id: patientId,
        visit_id: visitId,
        room_id: selectedRoom,
        total_estimated_cost: calculateEstimatedCost(),
        paperwork_completed: paperwork,
        admission_date: new Date().toISOString(),
        status: 'admitted'
      };

      console.log('Processing admission:', admissionRecord);
      
      // Update room status
      setAvailableRooms(prev => prev.map(room => 
        room.id === selectedRoom 
          ? { ...room, maintenance_status: 'occupied' as const, current_patient_id: patientId }
          : room
      ));

      alert('Patient admitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error processing admission:', error);
      alert('Failed to process admission');
    } finally {
      setLoading(false);
    }
  };

  const approveAdmissionRequest = async (requestId: string) => {
    try {
      setAdmissionRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      ));
      alert('Admission request approved!');
    } catch (error) {
      console.error('Error approving admission:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Admission Details</h3>
            
            {patient && (
              <Card className="bg-teal-50 border border-teal-200">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-teal-900 mb-2 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Patient Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Name:</strong> {patient.name}</p>
                      <p><strong>Age:</strong> {patient.age} years</p>
                      <p><strong>Phone:</strong> {patient.phone}</p>
                      <p><strong>Patient ID:</strong> {patient.uid}</p>
                    </div>
                    <div>
                      <p><strong>Blood Group:</strong> {patient.blood_group || 'Not specified'}</p>
                      <p><strong>Emergency Contact:</strong> {patient.emergency_contact || 'Not provided'}</p>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <p><strong>Allergies:</strong> {patient.allergies.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Admission Type *"
                value={admissionData.admission_type || ''}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, admission_type: e.target.value as any }))}
                options={[
                  { value: 'emergency', label: 'Emergency Admission' },
                  { value: 'planned', label: 'Planned Admission' },
                  { value: 'observation', label: 'Observation' },
                  { value: 'surgery', label: 'Surgery' }
                ]}
                required
              />

              <Select
                label="Ward Type *"
                value={admissionData.ward_type || ''}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, ward_type: e.target.value as any }))}
                options={[
                  { value: 'general', label: 'General Ward - ₹1500/day' },
                  { value: 'semi_private', label: 'Semi-Private - ₹2000/day' },
                  { value: 'private', label: 'Private Room - ₹3000/day' },
                  { value: 'icu', label: 'ICU - ₹5000/day' }
                ]}
                required
              />
            </div>

            <Input
              label="Estimated Duration (Days) *"
              type="number"
              value={admissionData.estimated_duration || ''}
              onChange={(e) => setAdmissionData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 1 }))}
              min="1"
              max="30"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Admission *
              </label>
              <textarea
                value={admissionData.reason || ''}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Detailed reason for admission"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requirements
              </label>
              <textarea
                value={admissionData.special_requirements || ''}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, special_requirements: e.target.value }))}
                placeholder="Any special medical requirements or instructions"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Room Assignment</h3>
            
            <div className="grid gap-4">
              {availableRooms
                .filter(room => room.room_type === admissionData.ward_type)
                .map((room) => (
                <Card 
                  key={room.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedRoom === room.id 
                      ? 'border-teal-500 bg-teal-50' 
                      : room.maintenance_status === 'available'
                        ? 'border-gray-200 hover:border-teal-300' 
                        : 'border-red-200 bg-red-50'
                  }`}
                  onClick={() => room.maintenance_status === 'available' && setSelectedRoom(room.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          Room {room.room_number} - Floor {room.floor_number}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {room.bed_count} bed{room.bed_count > 1 ? 's' : ''} | ₹{room.daily_rate}/day
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          room.maintenance_status === 'available' ? 'bg-green-100 text-green-800' :
                          room.maintenance_status === 'occupied' ? 'bg-red-100 text-red-800' :
                          room.maintenance_status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {room.maintenance_status.toUpperCase()}
                        </span>
                        {selectedRoom === room.id && (
                          <CheckSquare className="h-5 w-5 text-teal-600" />
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p><strong>Amenities:</strong> {room.amenities.join(', ')}</p>
                      <p><strong>Last Cleaned:</strong> {formatDate(room.last_cleaned)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedRoom && (
              <Card className="bg-green-50 border border-green-200">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Cost Estimation
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Room charges ({admissionData.estimated_duration} days):</span>
                      <span>₹{(availableRooms.find(r => r.id === selectedRoom)?.daily_rate || 0) * (admissionData.estimated_duration || 1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Doctor fees:</span>
                      <span>₹1000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nursing care:</span>
                      <span>₹{500 * (admissionData.estimated_duration || 1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Miscellaneous:</span>
                      <span>₹300</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-1">
                      <span>Total Estimated:</span>
                      <span>₹{calculateEstimatedCost()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Admission Paperwork</h3>
            
            <div className="grid gap-3">
              {Object.entries(paperwork).map(([key, value]) => (
                <Card key={key} className={`border-2 ${value ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          value ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}>
                          {value && <CheckSquare className="h-4 w-4 text-white" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {getPaperworkDescription(key)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={value ? "secondary" : "outline"}
                        onClick={() => handlePaperworkChange(key as keyof AdmissionPaperwork, !value)}
                      >
                        {value ? 'Completed' : 'Mark Complete'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Clipboard className="h-5 w-5 mr-2" />
                Paperwork Progress
              </h4>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(Object.values(paperwork).filter(Boolean).length / Object.keys(paperwork).length) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-blue-800 mt-2">
                {Object.values(paperwork).filter(Boolean).length} of {Object.keys(paperwork).length} items completed
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment & Final Confirmation</h3>
            
            <Card className="bg-yellow-50 border border-yellow-200">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Cost Breakdown
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Room charges:</span>
                    <span>₹{(availableRooms.find(r => r.id === selectedRoom)?.daily_rate || 0) * (admissionData.estimated_duration || 1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medical charges:</span>
                    <span>₹1800</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Estimated:</span>
                    <span>₹{calculateEstimatedCost()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Advance Payment (₹) *"
                type="number"
                value={admissionData.advance_payment || ''}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, advance_payment: parseFloat(e.target.value) || 0 }))}
                min="0"
                placeholder={`Minimum ₹${Math.round(calculateEstimatedCost() * 0.5)}`}
                required
              />

              <Select
                label="Payment Method *"
                value={admissionData.payment_method || 'cash'}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, payment_method: e.target.value }))}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Credit/Debit Card' },
                  { value: 'upi', label: 'UPI' },
                  { value: 'insurance', label: 'Insurance' },
                  { value: 'bank_transfer', label: 'Bank Transfer' }
                ]}
                required
              />
            </div>

            <Input
              label="Insurance Details"
              value={admissionData.insurance_details || ''}
              onChange={(e) => setAdmissionData(prev => ({ ...prev, insurance_details: e.target.value }))}
              placeholder="Insurance company and policy number"
            />

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Important Notes:
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Advance payment is required for admission</li>
                <li>• Final bill will be generated at discharge</li>
                <li>• Insurance claims will be processed separately</li>
                <li>• Emergency contact will be notified</li>
                <li>• Room can be changed based on availability</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPaperworkDescription = (key: string) => {
    const descriptions: { [key: string]: string } = {
      consent_form: 'Patient consent for admission and treatment',
      insurance_verification: 'Verify insurance coverage and eligibility',
      medical_history_review: 'Review complete medical history and allergies',
      allergy_check: 'Confirm all known allergies and reactions',
      emergency_contact_verified: 'Verify emergency contact information',
      advance_payment_received: 'Collect required advance payment',
      room_assignment: 'Assign and prepare room for patient',
      doctor_briefing: 'Brief attending doctor about patient condition'
    };
    return descriptions[key] || '';
  };

  if (showRequestsView) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Admission Requests" size="xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pending Admission Requests</h3>
            <Button onClick={() => setShowRequestsView(false)} variant="outline">
              New Admission
            </Button>
          </div>

          <div className="space-y-4">
            {admissionRequests.map((request) => (
              <Card key={request.id} className={`border-l-4 ${
                request.priority === 'urgent' ? 'border-red-500' : 'border-blue-500'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{request.patient.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {request.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Recommended by: Dr. {request.doctor.name} ({request.doctor.specialization})
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Patient: {request.patient.uid} | Age: {request.patient.age} | Phone: {request.patient.phone}
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm"><strong>Reason:</strong> {request.reason}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="capitalize">{request.admission_type} admission</span>
                          <span className="capitalize">{request.ward_type} ward</span>
                          <span>{request.estimated_duration} days</span>
                          <span className="font-medium text-green-600">₹{request.estimated_cost}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // View full details
                          alert('View full admission request details');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveAdmissionRequest(request.id)}
                        disabled={request.status !== 'pending'}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        {request.status === 'pending' ? 'Approve' : 'Approved'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {admissionRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bed className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>No admission requests found</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Patient Admission Process" size="xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Admission Management</h3>
            <p className="text-sm text-gray-600">Complete 4-step admission process</p>
          </div>
          <Button onClick={() => setShowRequestsView(true)} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            View Requests ({admissionRequests.length})
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold ${
                step < currentStep ? 'border-green-500 bg-green-500 text-white' :
                step === currentStep ? 'border-teal-500 bg-teal-500 text-white' :
                'border-gray-300 text-gray-500'
              }`}>
                {step < currentStep ? <CheckSquare className="h-5 w-5" /> : step}
              </div>
              {step < totalSteps && (
                <div className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div className={currentStep === 1 ? 'text-teal-600 font-semibold' : 'text-gray-500'}>
            Admission Details
          </div>
          <div className={currentStep === 2 ? 'text-teal-600 font-semibold' : 'text-gray-500'}>
            Room Assignment
          </div>
          <div className={currentStep === 3 ? 'text-teal-600 font-semibold' : 'text-gray-500'}>
            Paperwork
          </div>
          <div className={currentStep === 4 ? 'text-teal-600 font-semibold' : 'text-gray-500'}>
            Payment
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!isStepComplete(currentStep)}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={processAdmission}
                loading={loading}
                disabled={!isStepComplete(currentStep)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Bed className="h-4 w-4 mr-2" />
                Admit Patient
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};