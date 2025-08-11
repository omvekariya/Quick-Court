import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { venuesAPI, bookingsAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar as CalendarIcon, Clock, MapPin, CreditCard, User } from "lucide-react";
import { format, addDays, isSameDay, parseISO } from "date-fns";

export default function BookCourt() {
  const { id: venueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<Array<{ startTime: string; endTime: string }>>([]);

  // Fetch venue details
  const { data: venueData, isLoading: venueLoading, error: venueError } = useQuery({
    enabled: !!venueId,
    queryKey: ["venue", venueId],
    queryFn: () => venuesAPI.getById(venueId as string),
  });

  const venue = venueData?.data?.data?.venue;
  const courts = venueData?.data?.data?.courts || [];

  // Fetch available time slots for selected court and date
  const { data: timeSlotsData, isLoading: slotsLoading, error: slotsError } = useQuery({
    enabled: !!selectedCourt && !!selectedDate,
    queryKey: ["time-slots", selectedCourt, selectedDate],
    queryFn: () => venuesAPI.getTimeSlots(venueId as string, selectedCourt, format(selectedDate!, 'yyyy-MM-dd')),
  });

  const timeSlots = (timeSlotsData?.data?.data || []) as Array<{ startTime: string; endTime: string; booked?: boolean }>;

  const toggleSlot = (slot: { startTime: string; endTime: string }) => {
    const key = `${slot.startTime}-${slot.endTime}`;
    if (selectedSlots.some(s => `${s.startTime}-${s.endTime}` === key)) {
      setSelectedSlots(prev => prev.filter(s => `${s.startTime}-${s.endTime}` !== key));
    } else {
      setSelectedSlots(prev => [...prev, slot]);
    }
  };

  // Create booking mutation
  const createBooking = useMutation({
    mutationFn: async () => {
      if (!selectedCourt) {
        throw new Error('Please select a court');
      }
      if (!selectedDate) {
        throw new Error('Please select a date');
      }
      if (selectedSlots.length === 0) {
        throw new Error('Please select at least one time slot');
      }

      return await bookingsAPI.bulkCreate({
        courtId: selectedCourt,
        date: format(selectedDate, 'yyyy-MM-dd'),
        slots: selectedSlots,
        notes: `Bulk booking for ${selectedSlots.length} slot(s)`
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Booking Created!',
        description: 'Your court has been booked successfully.',
      });
      // Navigate to user's bookings
      navigate('/my-bookings');
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.response?.data?.error || 'Failed to create booking',
        variant: 'destructive'
      });
    }
  });

  // No duration handling needed now

  // Get available dates (next 30 days)
  const availableDates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i));

  // Filter out past dates and unavailable dates
  const selectableDates = availableDates.filter(date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  });

  // Calculate price for selected slots
  const selectedCourtData = courts.find(c => c.id === selectedCourt);
  const pricePerHour = selectedCourtData?.pricePerHour || 0;
  const totalMinutes = selectedSlots.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const slotDuration = (eh * 60 + em) - (sh * 60 + sm);
    return sum + Math.max(0, slotDuration); // Ensure non-negative duration
  }, 0);
  const totalPrice = (pricePerHour * totalMinutes) / 60;

  // Handle court selection change
  useEffect(() => {
    if (selectedCourt) {
      setSelectedSlots([]);
    }
  }, [selectedCourt]);

  // Handle date selection change
  useEffect(() => {
    if (selectedDate) {
      setSelectedSlots([]);
    }
  }, [selectedDate]);

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to book a court.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (venueError) {
    return (
      <main className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Book a Court</h1>
            <p className="text-muted-foreground mt-2">
              Select your preferred court, date, and time slot
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load venue details. Please try again or go back to select a different venue.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Book Court – QuickCourt</title>
        <meta name="description" content="Book your preferred court and time slot." />
        <link rel="canonical" href={`/book/${venueId}`} />
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Book a Court</h1>
          <p className="text-muted-foreground mt-2">
            Select your preferred court, date, and time slot
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Venue Information */}
        <div className="lg:col-span-2 space-y-6">
          {venueLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-16" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : venue ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {venue.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{venue.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {venue.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {venue.ownerName}
                  </div>
                </div>
                {venue.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.map((amenity: string) => (
                      <Badge key={amenity} variant="secondary">{amenity}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Court Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Court</CardTitle>
            </CardHeader>
            <CardContent>
              {venueLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : courts.length === 0 ? (
                <p className="text-muted-foreground">No courts available at this venue.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courts.map((court) => (
                    <div
                      key={court.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedCourt === court.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedCourt(court.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{court.name}</h3>
                          <p className="text-sm text-muted-foreground">{court.sportName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${court.pricePerHour}/hr</p>
                          <p className="text-xs text-muted-foreground">per hour</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date and Time Selection */}
          {selectedCourt && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Select Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => !selectableDates.some(d => isSameDay(d, date))}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Select Time Slot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {slotsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    </div>
                  ) : slotsError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Failed to load time slots.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Please try again or select a different date.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => window.location.reload()}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : !timeSlots || timeSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">
                        No available time slots for the selected date.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try selecting a different date or check back later.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span>Selected</span>
                        <div className="w-3 h-3 rounded-full bg-secondary"></div>
                        <span>Booked</span>
                        <div className="w-3 h-3 rounded-full border border-border"></div>
                        <span>Available</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot) => {
                          const key = `${slot.startTime}-${slot.endTime}`;
                          const isSelected = selectedSlots.some(s => `${s.startTime}-${s.endTime}` === key);
                          const isBooked = slot.booked === true;
                          return (
                            <Button
                              key={key}
                              variant={isSelected ? "default" : isBooked ? "secondary" : "outline"}
                              disabled={isBooked}
                              onClick={() => !isBooked && toggleSlot({ startTime: slot.startTime, endTime: slot.endTime })}
                              className="h-12 text-xs"
                              title={isBooked ? 'This slot is already booked' : `Select ${slot.startTime} - ${slot.endTime}`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-medium">{slot.startTime}</span>
                                {isBooked && <span className="text-xs opacity-75">Booked</span>}
                                {isSelected && <span className="text-xs opacity-75">Selected</span>}
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Duration Selection removed for multi-slot */}
            </>
          )}
        </div>

        {/* Booking Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {venue && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venue:</span>
                    <span className="font-medium">{venue.name}</span>
                  </div>
                  {selectedCourtData && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Court:</span>
                      <span className="font-medium">{selectedCourtData.name}</span>
                    </div>
                  )}
                  {selectedDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(selectedDate, 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  {selectedSlots.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Selected Slots:</span>
                        <span className="font-medium">{selectedSlots.length} slot(s)</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedSlots.map((slot, index) => (
                          <div key={index} className="flex justify-between">
                            <span>Slot {index + 1}:</span>
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Duration:</span>
                        <span className="font-medium">{totalMinutes} minutes</span>
                      </div>
                    </div>
                  )}
                  {selectedSlots.length > 0 && (
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Price:</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={!selectedCourt || selectedSlots.length === 0 || !selectedDate || createBooking.isPending}
                  onClick={() => createBooking.mutate()}
                >
                  {createBooking.isPending ? (
                    "Creating Booking..."
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Book Now
                    </>
                  )}
                </Button>
                
                {selectedSlots.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedSlots([])}
                    disabled={createBooking.isPending}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>

              {selectedSlots.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  You will be charged ${totalPrice.toFixed(2)} for this booking
                </p>
              )}
            </CardContent>
          </Card>

          {/* Venue Images */}
          {venue?.images?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Venue Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {venue.images.slice(0, 4).map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${venue.name} ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
