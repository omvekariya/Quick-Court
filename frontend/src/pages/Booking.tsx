import { Helmet } from "react-helmet-async";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { venues } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const TIMES = [
  "06:00 - 07:00",
  "07:00 - 08:00",
  "08:00 - 09:00",
  "18:00 - 19:00",
  "19:00 - 20:00",
  "20:00 - 21:00",
];

export default function Booking() {
  const { id } = useParams();
  const venue = useMemo(() => venues.find((v) => v.id === id), [id]);
  const [courtId, setCourtId] = useState<string | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const navigate = useNavigate();

  if (!venue) return null;
  const selectedCourt = venue.courts.find((c) => c.id === courtId);
  const total = selectedCourt ? selectedCourt.pricePerHour : 0;

  const confirm = () => {
    if (!selectedCourt || !time) return;
    toast({ title: "Payment successful", description: `Booking confirmed for ${time}.` });
    navigate("/my-bookings");
  };

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Book – {venue.name} | QuickCourt</title>
        <meta name="description" content={`Select court and timeslot for ${venue.name}.`} />
        <link rel="canonical" href={`/book/${venue.id}`} />
      </Helmet>

      <h1 className="text-3xl font-bold">Book {venue.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select court</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={courtId} onValueChange={setCourtId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a court" />
                </SelectTrigger>
                <SelectContent>
                  {venue.courts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} – {c.sportType} (${c.pricePerHour}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choose time</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIMES.map((t) => (
                <Button
                  key={t}
                  variant={time === t ? "default" : "outline"}
                  onClick={() => setTime(t)}
                >
                  {t}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>Venue</span>
                <span>{venue.name}</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>Court</span>
                <span>{selectedCourt ? selectedCourt.name : "–"}</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>Time</span>
                <span>{time || "–"}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>${total}</span>
              </div>
              <Button variant="hero" disabled={!selectedCourt || !time} onClick={confirm} className="w-full">
                Confirm & Pay
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
