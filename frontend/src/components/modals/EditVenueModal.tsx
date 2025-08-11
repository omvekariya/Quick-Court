import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { venuesAPI } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { uploadAPI } from "@/services/api";
import { X, Plus } from "lucide-react";

interface Venue {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  amenities: string[];
  openingHours: Record<string, any>;
}

interface EditVenueModalProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditVenueModal({ venue, isOpen, onClose, onSuccess }: EditVenueModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    address: "",
    latitude: "",
    longitude: "",
    images: [""],
    amenities: [""],
    openingHours: {
      monday: { open: "09:00", close: "21:00" },
      tuesday: { open: "09:00", close: "21:00" },
      wednesday: { open: "09:00", close: "21:00" },
      thursday: { open: "09:00", close: "21:00" },
      friday: { open: "09:00", close: "21:00" },
      saturday: { open: "10:00", close: "18:00" },
      sunday: { open: "10:00", close: "18:00" }
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when venue changes
  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || "",
        description: venue.description || "",
        location: venue.location || "",
        address: venue.address || "",
        latitude: venue.latitude?.toString() || "",
        longitude: venue.longitude?.toString() || "",
        images: venue.images && venue.images.length > 0 ? venue.images : [""],
        amenities: venue.amenities && venue.amenities.length > 0 ? venue.amenities : [""],
        openingHours: venue.openingHours || {
          monday: { open: "09:00", close: "21:00" },
          tuesday: { open: "09:00", close: "21:00" },
          wednesday: { open: "09:00", close: "21:00" },
          thursday: { open: "09:00", close: "21:00" },
          friday: { open: "09:00", close: "21:00" },
          saturday: { open: "10:00", close: "18:00" },
          sunday: { open: "10:00", close: "18:00" }
        }
      });
    }
  }, [venue]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => venuesAPI.update(venue.id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Venue updated successfully!",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update venue",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      images: formData.images.filter(img => img.trim() !== ""),
      amenities: formData.amenities.filter(amenity => amenity.trim() !== "")
    };

    updateMutation.mutate(submitData);
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ""]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  const addAmenity = () => {
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, ""]
    }));
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const updateAmenity = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => i === index ? value : amenity)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Venue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Venue Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Downtown Sports Center"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Downtown"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your venue, facilities, and what makes it special..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, City, State 12345"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="40.7128"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="-74.0060"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Images</h3>
            <p className="text-sm text-muted-foreground">
              Add image URLs for your venue. At least one image is recommended.
            </p>
            
          {formData.images.map((image, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={image}
                onChange={(e) => updateImage(index, e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const res = await uploadAPI.image(file);
                    const url = res.data?.data?.url;
                    if (url) updateImage(index, url);
                  } catch (err) {}
                }}
              />
              {formData.images.length > 1 && (
                <Button type="button" variant="outline" size="sm" onClick={() => removeImage(index)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
            
            <Button type="button" variant="outline" onClick={addImage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Amenities</h3>
            <p className="text-sm text-muted-foreground">
              List the amenities available at your venue.
            </p>
            
            {formData.amenities.map((amenity, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={amenity}
                  onChange={(e) => updateAmenity(index, e.target.value)}
                  placeholder="e.g., Parking, Locker Rooms, Equipment Rental"
                />
                {formData.amenities.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAmenity(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button type="button" variant="outline" onClick={addAmenity}>
              <Plus className="h-4 w-4 mr-2" />
              Add Amenity
            </Button>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Opening Hours</h3>
            <p className="text-sm text-muted-foreground">
              Set the opening hours for each day of the week.
            </p>
            
            {Object.entries(formData.openingHours).map(([day, hours]) => (
              <div key={day} className="grid grid-cols-3 gap-4 items-center">
                <Label className="capitalize">{day}</Label>
                <Input
                  type="time"
                  value={hours.open}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    openingHours: {
                      ...prev.openingHours,
                      [day]: { ...hours, open: e.target.value }
                    }
                  }))}
                />
                <Input
                  type="time"
                  value={hours.close}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    openingHours: {
                      ...prev.openingHours,
                      [day]: { ...hours, close: e.target.value }
                    }
                  }))}
                />
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update Venue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
