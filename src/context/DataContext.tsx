import { Doctor, Patient, Appointment, Prescription, Medicine, Invoice, InvoiceItem } from "@/types/pharmacy";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  getDocs,
  setDoc,
  getDoc
} from "firebase/firestore";
import { mockPatients, mockAppointments, mockPrescriptions, mockMedicines, mockInvoices } from "@/data/mockData";

interface DataContextType {
  clinicName: string;
  updateClinicName: (name: string) => Promise<void>;
  patients: Patient[];
  addPatient: (p: Omit<Patient, "id">) => Promise<void>;
  updatePatient: (id: string, p: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;

  appointments: Appointment[];
  addAppointment: (a: Omit<Appointment, "id">) => Promise<void>;
  updateAppointment: (id: string, a: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  prescriptions: Prescription[];
  addPrescription: (p: Omit<Prescription, "id">) => Promise<void>;
  updatePrescription: (id: string, p: Partial<Prescription>) => Promise<void>;
  deletePrescription: (id: string) => Promise<void>;

  medicines: Medicine[];
  addMedicine: (m: Omit<Medicine, "id">) => Promise<void>;
  updateMedicine: (id: string, m: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;

  invoices: Invoice[];
  addInvoice: (i: Omit<Invoice, "id">) => Promise<void>;
  updateInvoice: (id: string, i: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  doctors: Doctor[];
  addDoctor: (d: Omit<Doctor, "id">) => Promise<void>;
  updateDoctor: (id: string, d: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;

  loading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to sync a collection
  const syncCollection = (collName: string, setter: (data: any[]) => void) => {
    return onSnapshot(query(collection(db, collName)), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setter(data);
    });
  };

  useEffect(() => {
    const unsubPatients = syncCollection("patients", setPatients);
    const unsubAppointments = syncCollection("appointments", setAppointments);
    const unsubPrescriptions = syncCollection("prescriptions", setPrescriptions);
    const unsubMedicines = syncCollection("medicines", setMedicines);
    const unsubInvoices = syncCollection("invoices", setInvoices);
    const unsubDoctors = syncCollection("doctors", setDoctors);

    setLoading(false);

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubPrescriptions();
      unsubMedicines();
      unsubInvoices();
      unsubDoctors();
    };
  }, []);

  // Initialize data if empty
  useEffect(() => {
    const initialize = async () => {
      const pSnap = await getDocs(collection(db, "patients"));
      if (pSnap.empty) {
        // Upload mock records if DB is fresh
        mockPatients.forEach(p => addDoc(collection(db, "patients"), p));
        mockAppointments.forEach(a => addDoc(collection(db, "appointments"), { ...a, doctorName: "Dr. Pradeep Vind" }));
        mockPrescriptions.forEach(p => addDoc(collection(db, "prescriptions"), { ...p, doctorName: "Dr. Pradeep Vind" }));
        mockMedicines.forEach(m => addDoc(collection(db, "medicines"), { ...m, pricePerUnit: m.price, pricePerStrip: m.price * 10, quantityPerStrip: 10 }));
        mockInvoices.forEach(i => addDoc(collection(db, "invoices"), { 
          ...i, 
          subtotal: i.total, 
          discountApplied: false, 
          discountPercentage: 0, 
          discountAmount: 0 
        }));
        // Add default doctor
        addDoc(collection(db, "doctors"), { name: "Dr. Pradeep Vind", specialty: "General Physician" });
      }
    };
    initialize();
  }, []);

  const [clinicName, setClinicName] = useState("PharmaCare India");

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "clinic_info"), (doc) => {
      if (doc.exists()) {
        setClinicName(doc.data().name);
      }
    });
    return () => unsubSettings();
  }, []);

  const updateClinicName = async (name: string) => {
    await setDoc(doc(db, "settings", "clinic_info"), { name });
  };

  const value: DataContextType = {
    clinicName,
    updateClinicName,
    patients,
    addPatient: async (p) => { await addDoc(collection(db, "patients"), p); },
    updatePatient: async (id, p) => { await updateDoc(doc(db, "patients", id), p); },
    deletePatient: async (id) => { await deleteDoc(doc(db, "patients", id)); },

    appointments,
    addAppointment: async (a) => { await addDoc(collection(db, "appointments"), a); },
    updateAppointment: async (id, a) => { await updateDoc(doc(db, "appointments", id), a); },
    deleteAppointment: async (id) => { await deleteDoc(doc(db, "appointments", id)); },

    prescriptions,
    addPrescription: async (p) => { await addDoc(collection(db, "prescriptions"), p); },
    updatePrescription: async (id, p) => { 
      // Get current version from state
      const currentRx = prescriptions.find(rx => rx.id === id);
      if (!currentRx) return;

      const updatedRx = { ...currentRx, ...p };
      await updateDoc(doc(db, "prescriptions", id), p); 

      // Automated Billing & Stock Reduction Logic
      if (updatedRx.status === "dispensed" && currentRx.status !== "dispensed") {
        const invoiceItems: InvoiceItem[] = [];
        
        for (const item of updatedRx.medicines) {
          const med = medicines.find(m => m.id === item.medicineId);
          if (med) {
            const amount = med.pricePerUnit * item.quantity;
            invoiceItems.push({
              description: `${item.name} x${item.quantity}`,
              amount: amount,
              type: "Medicine"
            });

            // Reduce Stock
            const newStock = Math.max(0, med.stock - item.quantity);
            await updateDoc(doc(db, "medicines", med.id), { stock: newStock });
          }
        }

        invoiceItems.push({ description: "Consultation Fee", amount: 500, type: "Consultation" });
        const subtotal = invoiceItems.reduce((acc, curr) => acc + curr.amount, 0);

        const existingInvoice = invoices.find(inv => inv.prescriptionId === id);
        if (!existingInvoice) {
          await addDoc(collection(db, "invoices"), {
            patientId: updatedRx.patientId,
            patientName: updatedRx.patientName,
            date: new Date().toISOString().split("T")[0],
            items: invoiceItems,
            subtotal: subtotal,
            discountApplied: false,
            discountPercentage: 0,
            discountAmount: 0,
            total: subtotal,
            status: "pending",
            prescriptionId: id
          });
        }
      }
    },
    deletePrescription: async (id) => { await deleteDoc(doc(db, "prescriptions", id)); },

    medicines,
    addMedicine: async (m) => { await addDoc(collection(db, "medicines"), m); },
    updateMedicine: async (id, m) => { await updateDoc(doc(db, "medicines", id), m); },
    deleteMedicine: async (id) => { await deleteDoc(doc(db, "medicines", id)); },

    invoices,
    addInvoice: async (i) => { await addDoc(collection(db, "invoices"), i); },
    updateInvoice: async (id, i) => { await updateDoc(doc(db, "invoices", id), i); },
    deleteInvoice: async (id) => { await deleteDoc(doc(db, "invoices", id)); },

    doctors,
    addDoctor: async (d) => { await addDoc(collection(db, "doctors"), d); },
    updateDoctor: async (id, d) => { await updateDoc(doc(db, "doctors", id), d); },
    deleteDoctor: async (id) => { await deleteDoc(doc(db, "doctors", id)); },

    loading
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

