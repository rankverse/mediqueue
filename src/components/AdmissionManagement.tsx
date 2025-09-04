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
  Activity
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
  estimated_duration: number;
  reason: string;
  special_requirements: string;
  insurance_details: string;
  emergency_contact: string;
  advance_payment: number;
  total_estimated_cost: number;
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
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(4);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientDetails();
      fetchAvailableRooms();
    }
  }, [isOpen, patientId]);

  const fetchPatientDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
    }
  };

  const fetchAvailableRooms = async () => {
    // Demo room data
    const rooms = [
      { id: 'R101', type: 'general', name: 'General Ward - Room 101', price: 1500, available: true },
      { id: 'R201', type: 'private', name: 'Private Room 201', price: 3000, available: true },
      { id: 'R301', type: 'semi_private', name: 'Semi-Private Room 301', price: 2000, available: false },
      { id: 'ICU1', type: 'icu', name: 'ICU Bed 1', price: 5000, available: true }
    ];
    
    setAvailableRooms(rooms);
  };

  const calculateEstimatedCost = () => {
    const room = availableRooms.find(r => r.id === selectedRoom);
    const roomCost = room ? room.price * (admissionData.estimated_duration || 1) : 0;
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

      // In real implementation, save to database
      console.log('Processing admission:', admissionRecord);
      
      alert('Patient admitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error processing admission:', error);
      alert('Failed to process admission');
    } finally {
      setLoading(false);
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
                  <h4 className="font-semibold text-teal-900 mb-2">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Name:</strong> {patient.name}</p>
                      <p><strong>Age:</strong> {patient.age} years</p>
                      <p><strong>Phone:</strong> {patient.phone}</p>
                    </div>
                    <div>
                      <p><strong>Blood Group:</strong> {patient.blood_group || 'Not specified'}</p>
                      <p><strong>Emergency Contact:</strong> {patient.emergency_contact || 'Not provided'}</p>
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
                .filter(room => room.type === admissionData.ward_type)
                .map((room) => (
                <Card 
                  key={room.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedRoom === room.id 
                      ? 'border-teal-500 bg-teal-50' 
                      : room.available 
                        ? 'border-gray-200 hover:border-teal-300' 
                        : 'border-red-200 bg-red-50'
                  }`}
                  onClick={() => room.available && setSelectedRoom(room.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{room.name}</h4>
                        <p className="text-sm text-gray-600">₹{room.price}/day</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          room.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {room.available ? 'Available' : 'Occupied'}
                        </span>
                        {selectedRoom === room.id && (
                          <CheckSquare className="h-5 w-5 text-teal-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedRoom && (
              <Card className="bg-green-50 border border-green-200">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-green-900 mb-2">Cost Estimation</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Room charges ({admissionData.estimated_duration} days):</span>
                      <span>₹{(availableRooms.find(r => r.id === selectedRoom)?.price || 0) * (admissionData.estimated_duration || 1)}</span>
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
              <h4 className="font-semibold text-blue-900 mb-2">Paperwork Progress</h4>
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
                <h4 className="font-semibold text-yellow-900 mb-3">Cost Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Room charges:</span>
                    <span>₹{(availableRooms.find(r => r.id === selectedRoom)?.price || 0) * (admissionData.estimated_duration || 1)}</span>
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
                placeholder="Minimum 50% of estimated cost"
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
              <h4 className="font-semibold text-red-900 mb-2">Important Notes:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Advance payment is required for admission</li>
                <li>• Final bill will be generated at discharge</li>
                <li>• Insurance claims will be processed separately</li>
                <li>• Emergency contact will be notified</li>
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Patient Admission Process" size="xl">
      <div className="space-y-6">
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