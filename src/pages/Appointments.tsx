import { useData } from "@/context/DataContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CalendarDays, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Appointment } from "@/types/pharmacy";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";

const emptyAppt = { patientId: "", patientName: "", doctorName: "", date: "", time: "", status: "scheduled" as "scheduled" | "completed" | "cancelled", reason: "" };

const Appointments = () => {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, patients } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyAppt);

  const openNew = () => { setEditing(null); setForm(emptyAppt); setDialogOpen(true); };
  const openEdit = (a: Appointment) => { setEditing(a); setForm({ patientId: a.patientId, patientName: a.patientName, doctorName: a.doctorName, date: a.date, time: a.time, status: a.status, reason: a.reason }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.patientName.trim() || !form.doctorName.trim() || !form.date) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    if (editing) {
      updateAppointment(editing.id, form);
      toast({ title: "Appointment updated" });
    } else {
      addAppointment(form);
      toast({ title: "Appointment scheduled" });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) { deleteAppointment(deleteId); toast({ title: "Appointment deleted" }); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="w-6 h-6 text-primary" /> Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">{appointments.length} total appointments</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> New Appointment</Button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.id}</TableCell>
                <TableCell className="font-medium">{a.patientName}</TableCell>
                <TableCell>{a.doctorName}</TableCell>
                <TableCell>{a.date}</TableCell>
                <TableCell>{a.time}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">{a.reason}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {appointments.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No appointments</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Appointment" : "Schedule Appointment"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Patient Name *</Label>
              <Select value={form.patientName} onValueChange={(v) => { const p = patients.find((x) => x.name === v); setForm({ ...form, patientName: v, patientId: p?.id || "" }); }}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Doctor *</Label>
              <Select value={form.doctorName} onValueChange={(v) => setForm({ ...form, doctorName: v })}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (<SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Reason</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            {editing && (
              <div className="col-span-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: "scheduled" | "completed" | "cancelled") => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this appointment.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Appointments;
