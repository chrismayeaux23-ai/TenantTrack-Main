import React, { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProperties, useCreateProperty } from "@/hooks/use-properties";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/SimpleDialog";
import { Badge } from "@/components/ui/Badge";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Plus, Building, MapPin, Download, QrCode, Printer, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useSubscription } from "@/hooks/use-subscription";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { trackEvent } from "@/lib/analytics";

export default function Properties() {
  const { data: properties, isLoading } = useProperties();
  const { mutate: createProperty, isPending: isCreating } = useCreateProperty();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { limits, tierLabel } = useSubscription();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeQR, setActiveQR] = useState<{id: number, name: string} | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ name: "", address: "" });
  const qrRef = useRef<HTMLDivElement>(null);

  const deleteProperty = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/properties/${id}`);
      if (!res.ok) throw new Error("Failed to delete property");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recurring"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setDeleteConfirm(null);
      toast({ title: "Deleted", description: "Property and all associated data removed." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wasFirst = !properties || properties.length === 0;
    createProperty(formData, {
      onSuccess: () => {
        if (wasFirst) {
          trackEvent("onboarding_property_added");
        }
        setIsAddModalOpen(false);
        setFormData({ name: "", address: "" });
        toast({ title: "Success", description: "Property added successfully!" });
      }
    });
  };

  const downloadQR = () => {
    if (!qrRef.current || !activeQR) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    
    const url = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `QR-${activeQR.name.replace(/\s+/g, '-')}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground mt-2">Manage your buildings and generate report QR codes.</p>
        </div>
        <div className="flex items-center gap-3">
          {limits.maxProperties < 999 && (
            <Badge variant="outline" className="text-xs" data-testid="text-property-limit">
              {properties?.length || 0}/{limits.maxProperties} on {tierLabel}
            </Badge>
          )}
          <Button 
            onClick={() => {
              if ((properties?.length || 0) >= limits.maxProperties) {
                toast({ title: "Plan Limit Reached", description: `Your ${tierLabel} plan allows up to ${limits.maxProperties} properties. Upgrade to add more.`, variant: "destructive" });
                setLocation("/pricing");
                return;
              }
              setIsAddModalOpen(true);
            }} 
            className="shadow-lg shadow-primary/20"
            data-testid="button-add-property"
          >
            <Plus className="mr-2 h-5 w-5" /> Add Property
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties?.map((property) => (
          <div key={property.id} className="bg-card rounded-2xl p-6 border border-border shadow-sm hover-elevate flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
              {deleteConfirm === property.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">Delete?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteProperty.mutate(property.id)}
                    disabled={deleteProperty.isPending}
                    data-testid={`button-confirm-delete-property-${property.id}`}
                  >
                    {deleteProperty.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(null)}
                    data-testid={`button-cancel-delete-property-${property.id}`}
                  >
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(property.id)}
                  className="text-muted-foreground hover:text-red-400"
                  data-testid={`button-delete-property-${property.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">{property.name}</h3>
            <p className="text-muted-foreground flex items-start gap-2 text-sm mb-6 flex-1">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              {property.address}
            </p>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setActiveQR({ id: property.id, name: property.name })}
                data-testid={`button-view-qr-${property.id}`}
              >
                <QrCode className="mr-2 h-4 w-4" /> QR Code
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setLocation(`/flyer/${property.id}`)}
                data-testid={`button-print-flyer-${property.id}`}
              >
                <Printer className="mr-2 h-4 w-4" /> Print Flyer
              </Button>
            </div>
          </div>
        ))}

        {properties?.length === 0 && (
          <div className="col-span-full bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No properties yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Add your first property to generate a QR code and start receiving maintenance requests.</p>
            <Button onClick={() => setIsAddModalOpen(true)}>Add Your First Property</Button>
          </div>
        )}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <div>
          <h2 className="text-2xl font-display font-bold mb-6">Add New Property</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Sunset Apartments" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Input 
                id="address" 
                placeholder="123 Main St, City, ST 12345" 
                required 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <Button type="submit" className="w-full mt-2" isLoading={isCreating}>
              Create Property
            </Button>
          </form>
        </div>
      </Dialog>

      <Dialog open={!!activeQR} onOpenChange={() => setActiveQR(null)} className="sm:max-w-sm text-center p-8">
        {activeQR && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-display font-bold mb-2">{activeQR.name}</h2>
            <p className="text-sm text-muted-foreground mb-8">Scan to report a maintenance issue.</p>
            
            <div className="bg-white p-6 rounded-2xl shadow-inner border border-border mb-8 inline-block" ref={qrRef}>
              <QRCodeSVG 
                value={`${window.location.origin}/report/${activeQR.id}`} 
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>
            
            <Button onClick={downloadQR} className="w-full rounded-full" size="lg">
              <Download className="mr-2 h-5 w-5" /> Download QR as PNG
            </Button>
          </div>
        )}
      </Dialog>

    </AppLayout>
  );
}
