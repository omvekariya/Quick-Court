import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownerAPI, venuesAPI } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Star, 
  Calendar,
  Building2,
  Users,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import CreateVenueModal from "@/components/modals/CreateVenueModal";
import EditVenueModal from "@/components/modals/EditVenueModal";
import DeleteVenueModal from "@/components/modals/DeleteVenueModal";

interface Venue {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  rating: number;
  totalRatings: number;
  isApproved: boolean;
  isActive: boolean;
  courtCount: number;
  activeCourts: number;
  createdAt: string;
  images: string[];
  amenities: string[];
  openingHours?: Record<string, any>;
}

export default function VenueManagement() {
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch owner's venues
  const {
    data: venuesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["owner-venues"],
    queryFn: () => ownerAPI.getVenues(),
  });

  const venuesList: Venue[] = (venuesData?.data?.data as Venue[]) ?? [];

  // Delete venue mutation
  const deleteMutation = useMutation({
    mutationFn: (venueId: string) => venuesAPI.delete(venueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-venues"] });
      toast({
        title: "Success",
        description: "Venue deleted successfully",
      });
      setIsDeleteModalOpen(false);
      setSelectedVenue(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete venue",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (venue: Venue) => {
    setSelectedVenue(venue);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (venue: Venue) => {
    setSelectedVenue(venue);
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (venue: Venue) => {
    if (!venue.isApproved) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (!venue.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  if (error) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load venues. Please try again later.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Venue Management – QuickCourt</title>
        <meta name="description" content="Manage your sports venues and courts." />
        <link rel="canonical" href="/owner/venues" />
      </Helmet>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Venue Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your sports venues and courts
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Venue
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : venuesList.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Venues</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : venuesList.filter((v) => v.isActive && v.isApproved).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : venuesList.reduce((sum, v) => sum + (v.courtCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : venuesList.filter((v) => !v.isApproved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Venues List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : venuesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venuesList.map((venue: Venue) => (
            <Card key={venue.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {venue.location}
                    </p>
                  </div>
                  {getStatusBadge(venue)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {venue.description}
                </p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{venue.address}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span>{(venue.rating ?? 0).toFixed(1)} ({venue.totalRatings ?? 0} reviews)</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{venue.activeCourts} active courts</span>
                </div>

                {/* Quick add courts CTA */}
                <div className="pt-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/owner/courts">Add courts for this venue</Link>
                  </Button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link to={`/venue/${venue.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(venue)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(venue)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Venues Yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first sports venue to start accepting bookings.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Venue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateVenueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["owner-venues"] });
          setIsCreateModalOpen(false);
        }}
      />

      {selectedVenue && (
        <>
          <EditVenueModal
            venue={selectedVenue}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedVenue(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["owner-venues"] });
              setIsEditModalOpen(false);
              setSelectedVenue(null);
            }}
          />

          <DeleteVenueModal
            venue={selectedVenue}
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedVenue(null);
            }}
            onConfirm={() => deleteMutation.mutate(selectedVenue.id)}
            isLoading={deleteMutation.isPending}
          />
        </>
      )}
    </main>
  );
}
