import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { bookingsAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, Clock, MapPin, CreditCard, X, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

const STATUS_COLORS = {
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS = {
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export default function MyBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: bookingsData, isLoading, error } = useQuery({
    queryKey: ["user-bookings", selectedStatus],
    queryFn: () => bookingsAPI.getAll({ 
      status: selectedStatus === "all" ? undefined : selectedStatus 
    }),
  });

  const bookings = (bookingsData?.data?.data ?? []) as Array<{
    id: string;
    courtId: string;
    date: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    notes?: string;
    createdAt: string;
    courtName: string;
    sportName: string;
    pricePerHour: number;
    venueId: string;
    venueName: string;
    venueLocation: string;
    slots: Array<{
      id: string;
      startTime: string;
      endTime: string;
      duration: number;
      slotAmount: number;
    }>;
  }>;

  const cancelBooking = useMutation({
    mutationFn: (bookingId: string) => bookingsAPI.cancel(bookingId),
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  const handleCancel = (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      cancelBooking.mutate(bookingId);
    }
  };

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view your bookings.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>My Bookings – QuickCourt</title>
        <meta name="description" content="View and manage your court bookings." />
        <link rel="canonical" href="/my-bookings" />
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your court reservations
          </p>
        </div>
        <Button asChild>
          <Link to="/venues">Book New Court</Link>
        </Button>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              onClick={() => setSelectedStatus("all")}
              size="sm"
            >
              All Bookings
            </Button>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                onClick={() => setSelectedStatus(status)}
                size="sm"
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load bookings. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No bookings found</p>
                <p className="text-sm">
                  {selectedStatus === "all" 
                    ? "You haven't made any bookings yet." 
                    : `No ${selectedStatus} bookings found.`
                  }
                </p>
              </div>
              <Button asChild>
                <Link to="/venues">Book Your First Court</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue & Court</TableHead>
                    <TableHead>Date & Time Slots</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.venueName}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.courtName} ({booking.sportName})
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.venueLocation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {format(parseISO(booking.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="space-y-1">
                            {booking.slots.map((slot, index) => (
                              <div key={slot.id} className="text-sm text-muted-foreground">
                                {slot.startTime} - {slot.endTime}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {booking.slots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {slot.duration} min
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${booking.totalAmount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS]}
                        >
                          {STATUS_LABELS[booking.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                        >
                          {booking.paymentStatus === 'paid' ? (
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              Paid
                            </div>
                          ) : (
                            booking.paymentStatus
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/venue/${booking.venueId}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {booking.status === 'confirmed' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancelBooking.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{bookings.length}</div>
              <div className="text-sm text-muted-foreground">Total Bookings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                ${bookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {bookings.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {bookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
