import { useData } from "@/context/DataContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Settings as SettingsIcon, Plus, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const { doctors, addDoctor, deleteDoctor } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: "", specialty: "" });

  const handleAddDoctor = async () => {
    if (!newDoctor.name.trim()) return;
    await addDoctor(newDoctor);
    setNewDoctor({ name: "", specialty: "" });
    setDialogOpen(false);
    toast({ title: "Doctor added", description: `${newDoctor.name} has been added to the system.` });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" /> System Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage system configurations and personnel</p>
      </div>

      <div className="bg-card rounded-xl border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Doctor Management</h2>
              <p className="text-xs text-muted-foreground">Manage doctors available for appointments and prescriptions</p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)} variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Doctor
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Doctor Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{doc.specialty}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteDoctor(doc.id)}
                      disabled={doctors.length <= 1} // Keep at least one doctor
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Clinic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Clinic Name</p>
            <p className="font-medium">PharmaCare India</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Default Username</p>
            <p className="font-medium">SRI</p>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Doctor Name *</Label>
              <Input 
                placeholder="Dr. Name" 
                value={newDoctor.name} 
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Input 
                placeholder="Pediatrics, Orthopedics, etc." 
                value={newDoctor.specialty} 
                onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDoctor}>Add Doctor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
