import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ownerAPI } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function BookingsOverview() {
  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ["owner-bookings"], 
    queryFn: () => ownerAPI.getBookings() 
  });
  
  const bookings = (data?.data?.data ?? []) as Array<{ 
    id: string; 
    venueName: string; 
    courtName: string; 
    date: string; 
    status: string;
    totalAmount: number;
    slots: Array<{ startTime: string; endTime: string; duration: number; slotAmount: number }>;
  }>;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 space-y-8">
        <Helmet>
          <title>Bookings Overview – QuickCourt</title>
          <meta name="description" content="View upcoming and past bookings." />
          <link rel="canonical" href="/owner/bookings" />
        </Helmet>

        <h1 className="text-3xl font-bold">Bookings Overview</h1>

        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-10 space-y-8">
        <Helmet>
          <title>Bookings Overview – QuickCourt</title>
          <meta name="description" content="View upcoming and past bookings." />
          <link rel="canonical" href="/owner/bookings" />
        </Helmet>

        <h1 className="text-3xl font-bold">Bookings Overview</h1>

        <Card>
          <CardHeader>
            <CardTitle>Error Loading Bookings</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">There was an error loading your bookings.</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Bookings Overview – QuickCourt</title>
        <meta name="description" content="View upcoming and past bookings." />
        <link rel="canonical" href="/owner/bookings" />
      </Helmet>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookings Overview</h1>
        <Button onClick={() => refetch()}>Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No bookings found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Date & Time Slots</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.venueName || 'N/A'}</TableCell>
                    <TableCell>{b.courtName || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{b.date ? format(new Date(b.date), 'MMM dd, yyyy') : 'N/A'}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {b.slots && b.slots.length > 0 ? (
                          b.slots.map((slot, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span>{slot.startTime}-{slot.endTime}</span>
                              <span className="text-xs">({slot.duration}min)</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No time slots</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          b.status === "confirmed" ? "secondary" : 
                          b.status === 'cancelled' ? 'destructive' : 
                          b.status === 'completed' ? 'default' : 'outline'
                        }
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${b.totalAmount?.toFixed(2) || '0.00'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
