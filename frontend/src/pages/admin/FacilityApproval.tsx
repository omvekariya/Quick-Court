import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Eye, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function FacilityApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-venues"],
    queryFn: () => adminAPI.getPendingVenues(),
  });
  const pending = (data?.data?.data ?? []) as Array<{ id: string; name: string; ownerName: string; ownerEmail: string; description: string; location: string; address: string }>;

  const updateMutation = useMutation({
    mutationFn: ({ id, approved, feedback }: { id: string; approved: boolean; feedback?: string }) => 
      adminAPI.approveVenue(id, approved, feedback),
    onSuccess: (_, vars) => {
      toast({ 
        title: vars.approved ? 'Approved' : 'Rejected', 
        description: `Venue ${vars.approved ? 'approved' : 'rejected'} successfully.` 
      });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-venues"] });
      setRejectDialogOpen(false);
      setSelectedVenue(null);
      setRejectFeedback("");
    },
    onError: (e: any) => {
      console.error('Approval error:', e);
      toast({ 
        title: 'Error', 
        description: e.response?.data?.error || 'Failed to update venue status', 
        variant: 'destructive' 
      });
    },
  });

  const handleReject = (venue: any) => {
    setSelectedVenue(venue);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedVenue) {
      console.log('Rejecting venue:', selectedVenue.id, 'with feedback:', rejectFeedback);
      updateMutation.mutate({ 
        id: selectedVenue.id, 
        approved: false, 
        feedback: rejectFeedback.trim() || undefined 
      });
    }
  };

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Facility Approval – QuickCourt</title>
        <meta name="description" content="Approve or reject submitted facilities." />
        <link rel="canonical" href="/admin/facility-approval" />
      </Helmet>

      <h1 className="text-3xl font-bold">Facility Approval</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load pending venues. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending Venues</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending venues to approve.
            </div>
          ) : (
                         <Table>
                                <TableHeader>
                   <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead>Owner</TableHead>
                     <TableHead>Email</TableHead>
                     <TableHead>Location</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
               <TableBody>
                 {pending.map((p) => (
                                     <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.ownerName}</TableCell>
                    <TableCell>{p.ownerEmail}</TableCell>
                    <TableCell>{p.location}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending Approval</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                                               <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Open venue in new tab with admin authentication
                            const token = localStorage.getItem('token');
                            if (token) {
                              const newWindow = window.open(`/venue/${p.id}`, '_blank');
                              if (newWindow) {
                                // The new window will inherit the same localStorage, so the token will be available
                                newWindow.focus();
                              }
                            } else {
                              toast({
                                title: 'Error',
                                description: 'Authentication token not found',
                                variant: 'destructive'
                              });
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                       <Button 
                         variant="outline" 
                         size="sm"
                         disabled={updateMutation.isPending}
                         onClick={() => handleReject(p)}
                       >
                         {updateMutation.isPending ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           'Reject'
                         )}
                       </Button>
                       <Button 
                         variant="default" 
                         size="sm"
                         disabled={updateMutation.isPending}
                         onClick={() => updateMutation.mutate({ id: p.id, approved: true })}
                       >
                         {updateMutation.isPending ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           'Approve'
                         )}
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
          )}
                 </CardContent>
       </Card>

       {/* Reject Venue Dialog */}
       <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Reject Venue</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             {selectedVenue && (
               <div className="space-y-2">
                 <h3 className="font-medium">{selectedVenue.name}</h3>
                 <p className="text-sm text-muted-foreground">
                   Owner: {selectedVenue.ownerName} ({selectedVenue.ownerEmail})
                 </p>
                 <p className="text-sm text-muted-foreground">
                   Location: {selectedVenue.location}
                 </p>
                 <p className="text-sm text-muted-foreground">
                   Address: {selectedVenue.address}
                 </p>
                 <p className="text-sm">{selectedVenue.description}</p>
               </div>
             )}
             
             <div className="space-y-2">
               <Label htmlFor="feedback">Feedback (Optional)</Label>
               <Textarea
                 id="feedback"
                 placeholder="Provide feedback on why this venue is being rejected..."
                 value={rejectFeedback}
                 onChange={(e) => setRejectFeedback(e.target.value)}
                 rows={3}
               />
             </div>

             <div className="flex justify-end space-x-2">
               <Button
                 variant="outline"
                 onClick={() => {
                   setRejectDialogOpen(false);
                   setSelectedVenue(null);
                   setRejectFeedback("");
                 }}
               >
                 Cancel
               </Button>
               <Button
                 variant="destructive"
                 onClick={handleRejectConfirm}
                 disabled={updateMutation.isPending}
               >
                 {updateMutation.isPending ? (
                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
                 ) : (
                   <X className="h-4 w-4 mr-2" />
                 )}
                 Reject Venue
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </main>
   );
 }
