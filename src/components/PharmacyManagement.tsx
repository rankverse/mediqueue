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
  Calculator
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
  total_amount: number;
  discount: number;
  tax_amount: number;
  final_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

export const PharmacyManagement: React.FC<PharmacyManagementProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'medicines' | 'billing'>('prescriptions');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [bills, setBills] = useState<PharmacyBill[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [currentBill, setCurrentBill] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billTotal, setBillTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    if (isOpen) {
      fetchPrescriptions();
      fetchMedicines();
      fetchBills();
    }
  }, [isOpen]);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_history')
        .select(`
          *,
          patient:patients(*),
          doctor:doctors(*),
          visit:visits(*)
        `)
        .not('prescription', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      // Demo medicines data
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
        }
      ];
      
      setMedicines(demoMedicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchBills = async () => {
    try {
      // Demo bills data
      setBills([]);
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
          const dosage = parts[1]?.trim() || '';
          
          items.push({
            medicine_name: medicineName,
            dosage,
            frequency: 'As prescribed',
            duration: '5 days',
            quantity_needed: 10,
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
          ? { ...item, quantity: item.quantity + quantity }
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
    const taxAmount = ((subtotal - discountAmount) * 5) / 100; // 5% tax
    const total = subtotal - discountAmount + taxAmount;
    setBillTotal(total);
  };

  const generateBill = async () => {
    try {
      if (currentBill.length === 0) {
        alert('Please add items to the bill');
        return;
      }

      const billData = {
        patient_id: selectedPrescription?.patient?.id,
        prescription_id: selectedPrescription?.id,
        items: currentBill,
        total_amount: billTotal,
        discount,
        tax_amount: (billTotal * 5) / 100,
        final_amount: billTotal,
        payment_status: 'pending',
        payment_method: paymentMethod
      };

      // In real implementation, save to database
      console.log('Generated bill:', billData);
      
      setShowBillModal(true);
    } catch (error) {
      console.error('Error generating bill:', error);
    }
  };

  const printBill = () => {
    const billContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #0d9488; margin: 0;">MediQueue Pharmacy</h1>
          <p style="margin: 5px 0;">Professional Healthcare Services</p>
          <p style="margin: 5px 0;">Pharmacy Bill</p>
          <p style="margin: 5px 0;">Date: ${formatDate(new Date().toISOString())}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3>Patient Information</h3>
          <p><strong>Name:</strong> ${selectedPrescription?.patient?.name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${selectedPrescription?.patient?.phone || 'N/A'}</p>
          <p><strong>Patient ID:</strong> ${selectedPrescription?.patient?.uid || 'N/A'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3>Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Medicine</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qty</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${currentBill.map(item => `
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

        <div style="margin-top: 20px; text-align: right;">
          <p><strong>Subtotal: ₹${(billTotal / 1.05 * (1 + discount/100)).toFixed(2)}</strong></p>
          <p><strong>Discount (${discount}%): -₹${((billTotal / 1.05 * (1 + discount/100)) * discount/100).toFixed(2)}</strong></p>
          <p><strong>Tax (5%): ₹${(billTotal * 0.05).toFixed(2)}</strong></p>
          <p style="font-size: 18px; color: #0d9488;"><strong>Total: ₹${billTotal.toFixed(2)}</strong></p>
        </div>

        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px;">
          <p style="font-size: 12px; color: #666;">Thank you for choosing MediQueue Pharmacy</p>
          <p style="font-size: 12px; color: #666;">For any queries, contact: +91-XXXX-XXXX</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pharmacy Bill</title>
            <style>
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            ${billContent}
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #0d9488; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Bill</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
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
    m.generic_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pharmacy Management" size="xl">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: FileText },
              { key: 'medicines', label: `Medicine Inventory (${medicines.length})`, icon: Pill },
              { key: 'billing', label: `Billing & Sales`, icon: CreditCard }
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
              activeTab === 'medicines' ? 'Search medicines by name or generic name...' :
              'Search bills...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab Content */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="border border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {prescription.patient?.name} - {prescription.patient?.uid}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Dr. {prescription.doctor?.name} | {formatDate(prescription.created_at)}
                        </p>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium">Prescription:</p>
                          <p className="text-gray-700 line-clamp-3">{prescription.prescription}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            const items = parsePrescription(prescription.prescription);
                            setCurrentBill(items.map(item => ({
                              medicine_name: item.medicine_name,
                              quantity: item.quantity_needed,
                              price: 10, // Default price
                              total: 10 * item.quantity_needed
                            })));
                            calculateBillTotal();
                          }}
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
              {filteredMedicines.map((medicine) => (
                <Card key={medicine.id} className="border border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{medicine.name}</h4>
                        <p className="text-sm text-gray-600">
                          Generic: {medicine.generic_name} | {medicine.manufacturer}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="text-gray-600">Stock: {medicine.stock_quantity} {medicine.unit}s</span>
                          <span className="text-gray-600">Price: ₹{medicine.price}/{medicine.unit}</span>
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
                        <Button size="sm" variant="outline" onClick={() => setCurrentBill([])}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentBill.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{item.medicine_name}</span>
                            <span className="text-sm text-gray-600 ml-2">x{item.quantity}</span>
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
                {bills.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No bills generated yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bill Generation Modal */}
        <Modal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          title="Generate Bill"
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
                  <span>₹{(billTotal / 1.05).toFixed(2)}</span>
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowBillModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={printBill} variant="outline" className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Bill
              </Button>
              <Button onClick={() => {
                // Process payment and save bill
                setShowBillModal(false);
                alert('Bill processed successfully!');
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