import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Venue {
  id: string;
  name: string;
  description: string;
}

interface DeleteVenueModalProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function DeleteVenueModal({ 
  venue, 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading 
}: DeleteVenueModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Venue
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{venue.name}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">What will be deleted:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• The venue and all its information</li>
              <li>• All courts associated with this venue</li>
              <li>• All future bookings for this venue</li>
              <li>• All reviews for this venue</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Venue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
