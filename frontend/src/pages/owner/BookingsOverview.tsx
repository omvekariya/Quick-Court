import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ownerAPI } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BookingsOverview() {
  const { data, isLoading } = useQuery({ queryKey: ["owner-bookings"], queryFn: () => ownerAPI.getBookings() });
  const bookings = (data?.data?.data ?? []) as Array<{ id: string; venueName: string; courtName: string; date: string; startTime: string; endTime: string; status: string }>;

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.venueName}</TableCell>
                  <TableCell>{b.courtName}</TableCell>
                  <TableCell>{b.date} · {b.startTime}-{b.endTime}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "confirmed" ? "secondary" : b.status === 'cancelled' ? 'destructive' : 'outline'}>{b.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
