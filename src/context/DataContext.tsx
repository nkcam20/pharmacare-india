import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Patient, Appointment, Prescription, Medicine, Invoice } from "@/types/pharmacy";
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
  setDoc
} from "firebase/firestore";
import { mockPatients, mockAppointments, mockPrescriptions, mockMedicines, mockInvoices } from "@/data/mockData";

interface DataContextType {
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
  const [loading, setLoading] = useState(true);

  // Helper to sync a collection
  const syncCollection = (collName: string, setter: (data: any[]) => void) => {
    return onSnapshot(query(collection(db, collName)), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setter(data);
    });
  };

  useEffect(() => {
    const unsubPatients = syncCollection("patients", setPatients);
    const unsubAppointments = syncCollection("appointments", setAppointments);
    const unsubPrescriptions = syncCollection("prescriptions", setPrescriptions);
    const unsubMedicines = syncCollection("medicines", setMedicines);
    const unsubInvoices = syncCollection("invoices", setInvoices);

    setLoading(false);

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubPrescriptions();
      unsubMedicines();
      unsubInvoices();
    };
  }, []);

  // Initialize data if empty (Optional - for first time setup)
  useEffect(() => {
    const initialize = async () => {
      const pSnap = await getDocs(collection(db, "patients"));
      if (pSnap.empty) {
        // Upload mock records if DB is fresh
        mockPatients.forEach(p => addDoc(collection(db, "patients"), p));
        mockAppointments.forEach(a => addDoc(collection(db, "appointments"), a));
        mockPrescriptions.forEach(p => addDoc(collection(db, "prescriptions"), p));
        mockMedicines.forEach(m => addDoc(collection(db, "medicines"), { ...m, type: "Tablet" }));
        mockInvoices.forEach(i => addDoc(collection(db, "invoices"), { 
          ...i, 
          subtotal: i.total, 
          discountApplied: false, 
          discountPercentage: 0, 
          discountAmount: 0 
        }));
      }
    };
    initialize();
  }, []);

  const value: DataContextType = {
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
    updatePrescription: async (id, p) => { await updateDoc(doc(db, "prescriptions", id), p); },
    deletePrescription: async (id) => { await deleteDoc(doc(db, "prescriptions", id)); },

    medicines,
    addMedicine: async (m) => { await addDoc(collection(db, "medicines"), m); },
    updateMedicine: async (id, m) => { await updateDoc(doc(db, "medicines", id), m); },
    deleteMedicine: async (id) => { await deleteDoc(doc(db, "medicines", id)); },

    invoices,
    addInvoice: async (i) => { await addDoc(collection(db, "invoices"), i); },
    updateInvoice: async (id, i) => { await updateDoc(doc(db, "invoices", id), i); },
    deleteInvoice: async (id) => { await deleteDoc(doc(db, "invoices", id)); },
    loading
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

