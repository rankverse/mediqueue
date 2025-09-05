import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  ShoppingCart, 
  CreditCard, 
  FileText, 
  Printer, 
  Plus, 
  Minus,
  Check,
  AlertTriangle,
  Package,
  Calculator,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../lib/utils';

interface PharmacyManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  batch_number: string;
  expiry_date: string;
  price: number;
  stock_quantity: number;
  unit: string;
  category: string;
  prescription_required: boolean;
  created_at: string;
}

interface PrescriptionItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_needed: number;
  instructions: string;
}

interface PharmacyBill {
  id: string;
  patient_id: string;
  prescription_id?: string;
  items: any[];
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_method: 'cash' | 'card' | 'upi' | 'insurance';
  created_at: string;
  patient?: any;
}

export const PharmacyManagement: React.FC<PharmacyManagementProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'medicines' | 'billing' | 'analytics'>('prescriptions');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [bills, setBills] = useState<PharmacyBill[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [currentBill, setCurrentBill] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Partial<Medicine> | null>(null);
  const [billTotal, setBillTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPrescriptions();
      fetchMedicines();
      fetchBills();
    }
  }, [isOpen]);

  const fetchPrescriptions = async () => {
    try {
      // Demo prescriptions data
      const demoPrescriptions = [
        {
          id: '1',
          patient: {
            id: '1',
            uid: 'CLN1-ABC123',
            name: 'John Doe',
            phone: '+91-9876543210',
            age: 35
          },
          doctor: {
            id: '1',
            name: 'Dr. Sarah Johnson',
            specialization: 'general'
          },
          prescription: `1. Paracetamol 500mg - Take twice daily after meals for 3 days
2. Cetirizine 10mg - Take once daily at bedtime for 5 days
3. Vitamin C tablets - Take once daily for 7 days`,
          diagnosis: 'Common cold with mild fever',
          created_at: new Date().toISOString(),
          status: 'pending'
        },
        {
          id: '2',
          patient: {
            id: '2',
            uid: 'CLN1-XYZ789',
            name: 'Jane Smith',
            phone: '+91-9876543211',
            age: 28
          },
          doctor: {
            id: '2',
            name: 'Dr. Michael Chen',
            specialization: 'cardiology'
          },
          prescription: `1. Atorvastatin 20mg - Take once daily at night for 30 days
2. Aspirin 75mg - Take once daily after breakfast for 30 days`,
          diagnosis: 'High cholesterol',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'dispensed'
        }
      ];
      
      setPrescriptions(demoPrescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const demoMedicines: Medicine[] = [
        {
          id: '1',
          name: 'Paracetamol 500mg',
          generic_name: 'Acetaminophen',
          manufacturer: 'ABC Pharma',
          batch_number: 'PAR001',
          expiry_date: '2025-12-31',
          price: 2.50,
          stock_quantity: 500,
          unit: 'tablet',
          category: 'analgesic',
          prescription_required: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Amoxicillin 250mg',
          generic_name: 'Amoxicillin',
          manufacturer: 'XYZ Pharma',
          batch_number: 'AMX001',
          expiry_date: '2025-10-15',
          price: 5.00,
          stock_quantity: 200,
          unit: 'capsule',
          category: 'antibiotic',
          prescription_required: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Cetirizine 10mg',
          generic_name: 'Cetirizine HCl',
          manufacturer: 'DEF Pharma',
          batch_number: 'CET001',
          expiry_date: '2025-08-20',
          price: 1.20,
          stock_quantity: 300,
          unit: 'tablet',
          category: 'antihistamine',
          prescription_required: false,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Atorvastatin 20mg',
          generic_name: 'Atorvastatin Calcium',
          manufacturer: 'GHI Pharma',
          batch_number: 'ATO001',
          expiry_date: '2026-03-15',
          price: 8.50,
          stock_quantity: 150,
          unit: 'tablet',
          category: 'statin',
          prescription_required: true,
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Vitamin C 500mg',
          generic_name: 'Ascorbic Acid',
          manufacturer: 'JKL Pharma',
          batch_number: 'VTC001',
          expiry_date: '2025-11-30',
          price: 0.80,
          stock_quantity: 1000,
          unit: 'tablet',
          category: 'vitamin',
          prescription_required: false,
          created_at: new Date().toISOString()
        }
      ];
      
      setMedicines(demoMedicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchBills = async () => {
    try {
      const demoBills: PharmacyBill[] = [
        {
          id: '1',
          patient_id: '1',
          prescription_id: '1',
          items: [
            { medicine_name: 'Paracetamol 500mg', quantity: 6, price: 2.50, total: 15.00 },
            { medicine_name: 'Cetirizine 10mg', quantity: 5, price: 1.20, total: 6.00 }
          ],
          subtotal: 21.00,
          discount_percentage: 5,
          discount_amount: 1.05,
          tax_percentage: 5,
          tax_amount: 1.00,
          total_amount: 20.95,
          payment_status: 'paid',
          payment_method: 'cash',
          created_at: new Date().toISOString(),
          patient: {
            name: 'John Doe',
            uid: 'CLN1-ABC123',
            phone: '+91-9876543210'
          }
        }
      ];
      
      setBills(demoBills);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const parsePrescription = (prescriptionText: string): PrescriptionItem[] => {
    const lines = prescriptionText.split('\n').filter(line => line.trim());
    const items: PrescriptionItem[] = [];
    
    lines.forEach(line => {
      if (line.match(/^\d+\./)) {
        const parts = line.split('-');
        if (parts.length >= 2) {
          const medicineName = parts[0].replace(/^\d+\.\s*/, '').trim();
          const dosageInfo = parts[1]?.trim() || '';
          
          // Extract quantity from dosage info
          let quantity = 10; // Default
          if (dosageInfo.includes('3 days')) quantity = 6;
          if (dosageInfo.includes('5 days')) quantity = 10;
          if (dosageInfo.includes('7 days')) quantity = 14;
          if (dosageInfo.includes('30 days')) quantity = 30;
          
          items.push({
            medicine_name: medicineName,
            dosage: dosageInfo,
            frequency: 'As prescribed',
            duration: '5 days',
            quantity_needed: quantity,
            instructions: 'Take as directed'
          });
        }
      }
    });
    
    return items;
  };

  const addToBill = (medicine: Medicine, quantity: number) => {
    const existingItem = currentBill.find(item => item.medicine_id === medicine.id);
    
    if (existingItem) {
      setCurrentBill(prev => prev.map(item => 
        item.medicine_id === medicine.id 
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.price }
          : item
      ));
    } else {
      setCurrentBill(prev => [...prev, {
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        price: medicine.price,
        quantity,
        total: medicine.price * quantity
      }]);
    }
    
    calculateBillTotal();
  };

  const removeFromBill = (medicineId: string) => {
    setCurrentBill(prev => prev.filter(item => item.medicine_id !== medicineId));
    calculateBillTotal();
  };

  const calculateBillTotal = () => {
    const subtotal = currentBill.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * 5) / 100; // 5% tax
    const total = taxableAmount + taxAmount;
    setBillTotal(total);
  };

  const generateBill = async () => {
    try {
      if (currentBill.length === 0) {
        alert('Please add items to the bill');
        return;
      }

      const billData: PharmacyBill = {
        id: 'BILL-' + Date.now(),
        patient_id: selectedPatient?.id || '',
        prescription_id: selectedPrescription?.id,
        items: currentBill,
        subtotal: currentBill.reduce((sum, item) => sum + item.total, 0),
        discount_percentage: discount,
        discount_amount: (currentBill.reduce((sum, item) => sum + item.total, 0) * discount) / 100,
        tax_percentage: 5,
        tax_amount: billTotal * 0.05,
        total_amount: billTotal,
        payment_status: 'pending',
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
        patient: selectedPatient
      };

      setBills(prev => [billData, ...prev]);
      setShowBillModal(true);
    } catch (error) {
      console.error('Error generating bill:', error);
    }
  };

  const printBill = (bill: PharmacyBill) => {
    const billContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 28px;">MediQueue Pharmacy</h1>
          <p style="margin: 5px 0; color: #666;">Professional Healthcare Services</p>
          <p style="margin: 5px 0; color: #666;">Pharmacy Bill</p>
          <p style="margin: 5px 0; color: #666;">Date: ${formatDate(bill.created_at)} | Time: ${formatTime(bill.created_at)}</p>
          <p style="margin: 5px 0; color: #666; font-weight: bold;">Bill No: ${bill.id}</p>
        </div>
        
        <div style="margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px;">
          <h3 style="color: #374151; margin-bottom: 10px;">Patient Information</h3>
          <p><strong>Name:</strong> ${bill.patient?.name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${bill.patient?.phone || 'N/A'}</p>
          <p><strong>Patient ID:</strong> ${bill.patient?.uid || 'N/A'}</p>
          ${bill.prescription_id ? `<p><strong>Prescription ID:</strong> ${bill.prescription_id}</p>` : ''}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin-bottom: 10px;">Items</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Medicine</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qty</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rate</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.medicine_name}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.price.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; text-align: right; background: #f8fafc; padding: 15px; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>Subtotal: ₹${bill.subtotal.toFixed(2)}</strong></p>
          <p style="margin: 5px 0;"><strong>Discount (${bill.discount_percentage}%): -₹${bill.discount_amount.toFixed(2)}</strong></p>
          <p style="margin: 5px 0;"><strong>Tax (${bill.tax_percentage}%): ₹${bill.tax_amount.toFixed(2)}</strong></p>
          <p style="font-size: 18px; color: #0d9488; margin: 10px 0 0 0;"><strong>Total: ₹${bill.total_amount.toFixed(2)}</strong></p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">Payment Method: ${bill.payment_method.toUpperCase()}</p>
        </div>

        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px;">
          <p style="font-size: 12px; color: #666;">Thank you for choosing MediQueue Pharmacy</p>
          <p style="font-size: 12px; color: #666;">For any queries, contact: +91-XXXX-XXXX</p>
          <p style="font-size: 12px; color: #666;">This is a computer generated bill</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pharmacy Bill - ${bill.patient?.name}</title>
            <style>
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            ${billContent}
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #0d9488; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Print Bill</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const saveMedicine = async () => {
    try {
      if (!editingMedicine?.name || !editingMedicine?.price) {
        alert('Please fill in required fields');
        return;
      }

      const medicineData: Medicine = {
        id: editingMedicine.id || 'MED-' + Date.now(),
        name: editingMedicine.name,
        generic_name: editingMedicine.generic_name || '',
        manufacturer: editingMedicine.manufacturer || '',
        batch_number: editingMedicine.batch_number || '',
        expiry_date: editingMedicine.expiry_date || '',
        price: editingMedicine.price,
        stock_quantity: editingMedicine.stock_quantity || 0,
        unit: editingMedicine.unit || 'tablet',
        category: editingMedicine.category || 'general',
        prescription_required: editingMedicine.prescription_required || false,
        created_at: editingMedicine.created_at || new Date().toISOString()
      };

      if (editingMedicine.id) {
        setMedicines(prev => prev.map(m => m.id === medicineData.id ? medicineData : m));
      } else {
        setMedicines(prev => [medicineData, ...prev]);
      }

      setShowMedicineModal(false);
      setEditingMedicine(null);
      alert('Medicine saved successfully!');
    } catch (error) {
      console.error('Error saving medicine:', error);
      alert('Failed to save medicine');
    }
  };

  const deleteMedicine = (medicineId: string) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      setMedicines(prev => prev.filter(m => m.id !== medicineId));
    }
  };

  const processPrescription = (prescription: any) => {
    setSelectedPrescription(prescription);
    setSelectedPatient(prescription.patient);
    const items = parsePrescription(prescription.prescription);
    
    const billItems = items.map(item => {
      const medicine = medicines.find(m => 
        m.name.toLowerCase().includes(item.medicine_name.toLowerCase()) ||
        item.medicine_name.toLowerCase().includes(m.name.toLowerCase())
      );
      
      return {
        medicine_id: medicine?.id || 'unknown',
        medicine_name: item.medicine_name,
        quantity: item.quantity_needed,
        price: medicine?.price || 10,
        total: (medicine?.price || 10) * item.quantity_needed
      };
    });
    
    setCurrentBill(billItems);
    calculateBillTotal();
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    !searchQuery || 
    p.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient?.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient?.phone.includes(searchQuery)
  );

  const filteredMedicines = medicines.filter(m =>
    !searchQuery ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBills = bills.filter(b =>
    !searchQuery ||
    b.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pharmacy Management System" size="xl">
      <div className="space-y-6">
        {/* Pharmacy Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <FileText className="h-6 w-6 text-teal-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">{prescriptions.length}</div>
              <div className="text-sm text-gray-600">Prescriptions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">{medicines.length}</div>
              <div className="text-sm text-gray-600">Medicines</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <CreditCard className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">{bills.length}</div>
              <div className="text-sm text-gray-600">Bills Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">
                ₹{bills.reduce((sum, b) => sum + b.total_amount, 0).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Revenue</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: FileText },
              { key: 'medicines', label: `Medicine Inventory (${medicines.length})`, icon: Pill },
              { key: 'billing', label: `Billing & Sales (${bills.length})`, icon: CreditCard },
              { key: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(({ key, label, icon: Icon }) => (
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
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="flex space-x-3">
          <Input
            placeholder={
              activeTab === 'prescriptions' ? 'Search by patient name, UID, or phone...' :
              activeTab === 'medicines' ? 'Search medicines by name, generic name, or category...' :
              activeTab === 'billing' ? 'Search bills by patient name or bill ID...' :
              'Search...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline">
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={() => {
            fetchPrescriptions();
            fetchMedicines();
            fetchBills();
          }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab Content */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">Digital Prescriptions</h4>
                <div className="text-sm text-gray-600">
                  Pending: {prescriptions.filter(p => p.status === 'pending').length} | 
                  Dispensed: {prescriptions.filter(p => p.status === 'dispensed').length}
                </div>
              </div>

              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="border border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {prescription.patient?.name} - {prescription.patient?.uid}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {prescription.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Dr. {prescription.doctor?.name} | {formatDate(prescription.created_at)} | 
                          Phone: {prescription.patient?.phone}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-sm mb-1">Diagnosis: {prescription.diagnosis}</p>
                          <div className="text-sm text-gray-700">
                            <p className="font-medium">Prescription:</p>
                            <pre className="whitespace-pre-wrap text-xs mt-1">{prescription.prescription}</pre>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => processPrescription(prescription)}
                          disabled={prescription.status === 'dispensed'}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredPrescriptions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No prescriptions found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'medicines' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">Medicine Inventory</h4>
                <Button onClick={() => {
                  setEditingMedicine({
                    name: '',
                    generic_name: '',
                    manufacturer: '',
                    batch_number: '',
                    expiry_date: '',
                    price: 0,
                    stock_quantity: 0,
                    unit: 'tablet',
                    category: 'general',
                    prescription_required: false
                  });
                  setShowMedicineModal(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medicine
                </Button>
              </div>

              {filteredMedicines.map((medicine) => (
                <Card key={medicine.id} className="border border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{medicine.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            medicine.stock_quantity > 50 ? 'bg-green-100 text-green-800' :
                            medicine.stock_quantity > 10 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {medicine.stock_quantity > 50 ? 'In Stock' :
                             medicine.stock_quantity > 10 ? 'Low Stock' : 'Critical'}
                          </span>
                          {medicine.prescription_required && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                              Rx Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Generic: {medicine.generic_name} | {medicine.manufacturer} | 
                          Category: {medicine.category}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Stock:</span>
                            <span className="font-medium ml-1">{medicine.stock_quantity} {medicine.unit}s</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Price:</span>
                            <span className="font-medium ml-1">₹{medicine.price}/{medicine.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Batch:</span>
                            <span className="font-medium ml-1">{medicine.batch_number}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Expiry:</span>
                            <span className="font-medium ml-1">{formatDate(medicine.expiry_date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          max={medicine.stock_quantity}
                          className="w-20"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const quantity = parseInt((e.target as HTMLInputElement).value);
                              if (quantity > 0) {
                                addToBill(medicine, quantity);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => addToBill(medicine, 1)}
                          disabled={medicine.stock_quantity === 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMedicine(medicine);
                            setShowMedicineModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMedicine(medicine.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredMedicines.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No medicines found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              {/* Current Bill */}
              {currentBill.length > 0 && (
                <Card className="border-l-4 border-teal-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-teal-900">Current Bill</h4>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={generateBill}>
                          <Calculator className="h-4 w-4 mr-1" />
                          Generate Bill
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setCurrentBill([]);
                          setBillTotal(0);
                        }}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedPatient && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <h5 className="font-semibold text-blue-900">Patient: {selectedPatient.name}</h5>
                          <p className="text-sm text-blue-800">ID: {selectedPatient.uid} | Phone: {selectedPatient.phone}</p>
                        </div>
                      )}

                      {currentBill.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{item.medicine_name}</span>
                            <span className="text-sm text-gray-600 ml-2">x{item.quantity} @ ₹{item.price}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">₹{item.total.toFixed(2)}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromBill(item.medicine_id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t pt-2 mt-2">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                          <Input
                            label="Discount (%)"
                            type="number"
                            value={discount}
                            onChange={(e) => {
                              setDiscount(parseFloat(e.target.value) || 0);
                              calculateBillTotal();
                            }}
                            min="0"
                            max="50"
                            placeholder="0"
                          />
                          <Select
                            label="Payment Method"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            options={[
                              { value: 'cash', label: 'Cash' },
                              { value: 'card', label: 'Card' },
                              { value: 'upi', label: 'UPI' },
                              { value: 'insurance', label: 'Insurance' }
                            ]}
                          />
                        </div>
                        <div className="flex justify-between text-lg font-bold text-teal-600">
                          <span>Total:</span>
                          <span>₹{billTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Bills */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Recent Bills</h4>
                {filteredBills.map((bill) => (
                  <Card key={bill.id} className="border border-gray-200">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold text-gray-900">
                            {bill.patient?.name} - {bill.id}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {formatDate(bill.created_at)} | {bill.items.length} items | 
                            Payment: {bill.payment_method.toUpperCase()}
                          </p>
                          <div className="text-lg font-bold text-teal-600 mt-1">
                            ₹{bill.total_amount.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            bill.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            bill.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {bill.payment_status.toUpperCase()}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printBill(bill)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredBills.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No bills found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <h4 className="font-semibold">Today's Sales</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₹{bills.reduce((sum, b) => sum + b.total_amount, 0).toFixed(0)}
                    </div>
                    <p className="text-sm text-gray-600">{bills.length} transactions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h4 className="font-semibold">Top Selling</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <div className="font-medium">Paracetamol 500mg</div>
                        <div className="text-gray-600">45 units sold</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Cetirizine 10mg</div>
                        <div className="text-gray-600">32 units sold</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h4 className="font-semibold">Low Stock Alert</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {medicines.filter(m => m.stock_quantity <= 10).map(medicine => (
                        <div key={medicine.id} className="text-sm">
                          <div className="font-medium text-red-600">{medicine.name}</div>
                          <div className="text-gray-600">{medicine.stock_quantity} {medicine.unit}s left</div>
                        </div>
                      ))}
                      {medicines.filter(m => m.stock_quantity <= 10).length === 0 && (
                        <p className="text-sm text-green-600">All medicines well stocked</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Medicine Edit Modal */}
        <Modal
          isOpen={showMedicineModal}
          onClose={() => {
            setShowMedicineModal(false);
            setEditingMedicine(null);
          }}
          title={`${editingMedicine?.id ? 'Edit' : 'Add'} Medicine`}
          size="lg"
        >
          {editingMedicine && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Medicine Name *"
                  value={editingMedicine.name || ''}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, name: e.target.value }))}
                  placeholder="e.g., Paracetamol 500mg"
                  required
                />
                <Input
                  label="Generic Name"
                  value={editingMedicine.generic_name || ''}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, generic_name: e.target.value }))}
                  placeholder="e.g., Acetaminophen"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Manufacturer"
                  value={editingMedicine.manufacturer || ''}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, manufacturer: e.target.value }))}
                  placeholder="Pharmaceutical company"
                />
                <Input
                  label="Batch Number"
                  value={editingMedicine.batch_number || ''}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, batch_number: e.target.value }))}
                  placeholder="Batch/Lot number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Price per Unit (₹) *"
                  type="number"
                  value={editingMedicine.price || ''}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, price: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  required
                />
                <Input
                  label="Stock Quantity *"
                  type="number"
                  value={editingMedicine.stock_quantity || ''}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, stock_quantity: parseInt(e.target.value) || 0 }))}
                  min="0"
                  required
                />
                <Select
                  label="Unit"
                  value={editingMedicine.unit || 'tablet'}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, unit: e.target.value }))}
                  options={[
                    { value: 'tablet', label: 'Tablet' },
                    { value: 'capsule', label: 'Capsule' },
                    { value: 'syrup', label: 'Syrup (ml)' },
                    { value: 'injection', label: 'Injection' },
                    { value: 'cream', label: 'Cream (gm)' },
                    { value: 'drops', label: 'Drops (ml)' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Expiry Date"
                  type="date"
                  value={editingMedicine.expiry_date || ''}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, expiry_date: e.target.value }))}
                />
                <Select
                  label="Category"
                  value={editingMedicine.category || 'general'}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, category: e.target.value }))}
                  options={[
                    { value: 'general', label: 'General' },
                    { value: 'analgesic', label: 'Analgesic' },
                    { value: 'antibiotic', label: 'Antibiotic' },
                    { value: 'antihistamine', label: 'Antihistamine' },
                    { value: 'vitamin', label: 'Vitamin' },
                    { value: 'cardiac', label: 'Cardiac' },
                    { value: 'diabetes', label: 'Diabetes' },
                    { value: 'respiratory', label: 'Respiratory' }
                  ]}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="prescription_required"
                  checked={editingMedicine.prescription_required || false}
                  onChange={(e) => setEditingMedicine(prev => ({ ...prev!, prescription_required: e.target.checked }))}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="prescription_required" className="text-sm font-medium text-gray-700">
                  Prescription Required
                </label>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMedicineModal(false);
                    setEditingMedicine(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveMedicine}
                  className="flex-1"
                >
                  Save Medicine
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Bill Generation Modal */}
        <Modal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          title="Generate Pharmacy Bill"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h4 className="font-semibold text-teal-900 mb-2">Bill Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{currentBill.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{currentBill.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount ({discount}%):</span>
                  <span>-₹{((currentBill.reduce((sum, item) => sum + item.total, 0) * discount) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%):</span>
                  <span>₹{(billTotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{billTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowBillModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => {
                const latestBill = bills[0];
                if (latestBill) printBill(latestBill);
              }} variant="outline" className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Bill
              </Button>
              <Button onClick={() => {
                // Mark as paid and close
                setBills(prev => prev.map(b => 
                  b.id === bills[0]?.id ? { ...b, payment_status: 'paid' as const } : b
                ));
                setCurrentBill([]);
                setBillTotal(0);
                setSelectedPatient(null);
                setSelectedPrescription(null);
                setShowBillModal(false);
                alert('Payment processed successfully!');
              }} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Modal>
  );
};