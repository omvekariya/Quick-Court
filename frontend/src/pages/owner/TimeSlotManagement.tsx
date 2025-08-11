import { Helmet } from "react-helmet-async";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ownerAPI } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Building2, Circle } from "lucide-react";

const DAYS = [
  { id: 0, name: "Sunday", short: "Sun" },
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
];

const TIME_SLOTS = [
  { start: "06:00", end: "07:00", label: "6:00 AM" },
  { start: "07:00", end: "08:00", label: "7:00 AM" },
  { start: "08:00", end: "09:00", label: "8:00 AM" },
  { start: "09:00", end: "10:00", label: "9:00 AM" },
  { start: "10:00", end: "11:00", label: "10:00 AM" },
  { start: "11:00", end: "12:00", label: "11:00 AM" },
  { start: "12:00", end: "13:00", label: "12:00 PM" },
  { start: "13:00", end: "14:00", label: "1:00 PM" },
  { start: "14:00", end: "15:00", label: "2:00 PM" },
  { start: "15:00", end: "16:00", label: "3:00 PM" },
  { start: "16:00", end: "17:00", label: "4:00 PM" },
  { start: "17:00", end: "18:00", label: "5:00 PM" },
  { start: "18:00", end: "19:00", label: "6:00 PM" },
  { start: "19:00", end: "20:00", label: "7:00 PM" },
  { start: "20:00", end: "21:00", label: "8:00 PM" },
  { start: "21:00", end: "22:00", label: "9:00 PM" },
  { start: "22:00", end: "23:00", label: "10:00 PM" },
];

export default function TimeSlotManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>(undefined);
  const [selectedCourtId, setSelectedCourtId] = useState<string | undefined>(undefined);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  const { data: venuesData } = useQuery({ 
    queryKey: ["owner-venues"], 
    queryFn: () => ownerAPI.getVenues() 
  });
  const venues = (venuesData?.data?.data ?? []) as Array<{ id: string; name: string }>;
  
  useEffect(() => { 
    if (!selectedVenueId && venues.length) setSelectedVenueId(venues[0].id); 
  }, [venues, selectedVenueId]);

  const { data: courtsData } = useQuery({
    enabled: !!selectedVenueId,
    queryKey: ["owner-courts", selectedVenueId],
    queryFn: () => ownerAPI.getCourts(selectedVenueId as string),
  });
  const courts = (courtsData?.data?.data ?? []) as Array<{ id: string; name: string; sportName: string }>;
  
  useEffect(() => { 
    if (!selectedCourtId && courts.length) setSelectedCourtId(courts[0].id); 
  }, [courts, selectedCourtId]);

  const { data: slotsData, refetch } = useQuery({
    enabled: !!selectedCourtId,
    queryKey: ["owner-court-slots", selectedCourtId],
    queryFn: () => ownerAPI.getCourtSlots(selectedCourtId as string),
  });
  const slots = (slotsData?.data?.data ?? []) as Array<{ 
    id: string;
    dayOfWeek: number; 
    startTime: string; 
    endTime: string; 
    isAvailable: number;
    isMaintenance?: number;
  }>;

  // Initialize selected slots from existing data
  useEffect(() => {
    if (slots.length > 0) {
      const blockedSlots = new Set<string>();
      slots.forEach(slot => {
        if (slot.isAvailable === 0) {
          const key = `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`;
          blockedSlots.add(key);
        }
      });
      setSelectedSlots(blockedSlots);
    }
  }, [slots]);

  const toggleSlot = (dayId: number, timeSlot: typeof TIME_SLOTS[0]) => {
    const key = `${dayId}-${timeSlot.start}-${timeSlot.end}`;
    const newSelected = new Set(selectedSlots);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedSlots(newSelected);
  };

  const isSlotSelected = (dayId: number, timeSlot: typeof TIME_SLOTS[0]) => {
    const key = `${dayId}-${timeSlot.start}-${timeSlot.end}`;
    return selectedSlots.has(key);
  };

  const saveTimeSlots = useMutation({
    mutationFn: async () => {
      if (!selectedCourtId) throw new Error('No court selected');
      
      const payload = TIME_SLOTS.map(timeSlot => 
        DAYS.map(day => ({
          dayOfWeek: day.id,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          isAvailable: !isSlotSelected(day.id, timeSlot),
          isMaintenance: maintenanceMode && isSlotSelected(day.id, timeSlot) || false
        }))
      ).flat();

      return await ownerAPI.saveCourtSlots(selectedCourtId, payload);
    },
    onSuccess: () => {
      toast({ 
        title: 'Success', 
        description: 'Time slots updated successfully!' 
      });
      queryClient.invalidateQueries({ queryKey: ["owner-court-slots", selectedCourtId] });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.error || 'Failed to update time slots', 
        variant: 'destructive' 
      });
    }
  });

  const quickActions = [
    { label: "Open All Day", action: () => setSelectedSlots(new Set()) },
    { label: "Close All Day", action: () => {
      const allSlots = new Set<string>();
      DAYS.forEach(day => {
        TIME_SLOTS.forEach(timeSlot => {
          allSlots.add(`${day.id}-${timeSlot.start}-${timeSlot.end}`);
        });
      });
      setSelectedSlots(allSlots);
    }},
    { label: "Business Hours Only", action: () => {
      const businessSlots = new Set<string>();
      DAYS.forEach(day => {
        TIME_SLOTS.forEach(timeSlot => {
          const hour = parseInt(timeSlot.start.split(':')[0]);
          if (hour < 8 || hour >= 22) {
            businessSlots.add(`${day.id}-${timeSlot.start}-${timeSlot.end}`);
          }
        });
      });
      setSelectedSlots(businessSlots);
    }},
    { label: "Weekend Only", action: () => {
      const weekendSlots = new Set<string>();
      [0, 6].forEach(dayId => { // Sunday and Saturday
        TIME_SLOTS.forEach(timeSlot => {
          weekendSlots.add(`${dayId}-${timeSlot.start}-${timeSlot.end}`);
        });
      });
      setSelectedSlots(weekendSlots);
    }}
  ];

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Time Slot Management – QuickCourt</title>
        <meta name="description" content="Set availability and block maintenance slots." />
        <link rel="canonical" href="/owner/time-slots" />
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Slot Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage court availability and block maintenance slots
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
          </div>
          {maintenanceMode && (
            <Badge variant="destructive">Maintenance</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selection Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Venue Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Venue</Label>
                <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Court</Label>
                <Select value={selectedCourtId} onValueChange={setSelectedCourtId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select court" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4" />
                          {c.name} ({c.sportName})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.action}
                  className="w-full justify-start"
                >
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Save Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="hero" 
                onClick={() => saveTimeSlots.mutate()}
                disabled={saveTimeSlots.isPending || !selectedCourtId}
                className="w-full"
              >
                {saveTimeSlots.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedSlots.size} slot(s) will be blocked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Time Slot Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Click on time slots to toggle availability. {maintenanceMode ? "Red slots indicate maintenance." : "Blocked slots are unavailable for booking."}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    <div className="h-10"></div> {/* Empty corner */}
                    {DAYS.map(day => (
                      <div key={day.id} className="h-10 flex items-center justify-center text-sm font-medium bg-muted rounded-md">
                        {day.short}
                      </div>
                    ))}
                  </div>

                  {/* Time Slot Rows */}
                  {TIME_SLOTS.map((timeSlot, timeIndex) => (
                    <div key={timeIndex} className="grid grid-cols-8 gap-1 mb-1">
                      {/* Time Label */}
                      <div className="h-12 flex items-center justify-center text-sm text-muted-foreground bg-muted rounded-md">
                        {timeSlot.label}
                      </div>
                      
                      {/* Day Columns */}
                      {DAYS.map(day => {
                        const isSelected = isSlotSelected(day.id, timeSlot);
                        const isWeekend = day.id === 0 || day.id === 6;
                        
                        return (
                          <button
                            key={day.id}
                            onClick={() => toggleSlot(day.id, timeSlot)}
                            className={`
                              h-12 rounded-md border-2 transition-all duration-200 flex items-center justify-center text-xs font-medium
                              ${isSelected 
                                ? maintenanceMode 
                                  ? 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200' 
                                  : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
                                : 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                              }
                              ${isWeekend ? 'ring-1 ring-blue-200' : ''}
                            `}
                          >
                            {isSelected ? (maintenanceMode ? '🔧' : '❌') : '✓'}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
                  <span>Blocked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span>Maintenance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-50 ring-1 ring-blue-200 rounded"></div>
                  <span>Weekend</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
