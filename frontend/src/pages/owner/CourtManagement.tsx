import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { ownerAPI, courtsAPI, sportsAPI } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function CourtManagement() {
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [sportId, setSportId] = useState<string>("");
  const [price, setPrice] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: venuesData } = useQuery({ queryKey: ["owner-venues"], queryFn: () => ownerAPI.getVenues() });
  const venues = (venuesData?.data?.data ?? []) as Array<{ id: string; name: string }>;

  useEffect(() => {
    if (!selectedVenueId && venues.length) setSelectedVenueId(venues[0].id);
  }, [venues, selectedVenueId]);

  const { data: sportsData } = useQuery({ queryKey: ["sports"], queryFn: () => sportsAPI.getAll() });
  const sports = (sportsData?.data?.data ?? []) as Array<{ id: string; name: string }>;

  const { data: courtsData, isLoading } = useQuery({
    enabled: !!selectedVenueId,
    queryKey: ["owner-courts", selectedVenueId],
    queryFn: () => ownerAPI.getCourts(selectedVenueId as string),
  });
  const courts = (courtsData?.data?.data ?? []) as Array<{ id: string; name: string; sportName: string; pricePerHour: number }>;

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedVenueId) throw new Error('No venue selected');
      return courtsAPI.create(selectedVenueId, {
        name,
        sportId,
        pricePerHour: parseFloat(price)
      });
    },
    onSuccess: () => {
      toast({ title: "Court saved", description: "Court added successfully." });
      setName("");
      setPrice("");
      queryClient.invalidateQueries({ queryKey: ["owner-courts", selectedVenueId] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.response?.data?.error || 'Failed', variant: 'destructive' })
  });

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Court Management – QuickCourt</title>
        <meta name="description" content="Manage courts, pricing and details." />
        <link rel="canonical" href="/owner/courts" />
      </Helmet>

      <h1 className="text-3xl font-bold">Court Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add / Edit Court</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2 sm:col-span-1">
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
          <div className="grid gap-2 sm:col-span-1">
            <Label htmlFor="name">Court name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Court 1" />
          </div>
          <div className="grid gap-2 sm:col-span-1">
            <Label>Sport</Label>
            <Select value={sportId} onValueChange={setSportId}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {sports.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-1">
            <Label htmlFor="price">Price/hour ($)</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 15" />
          </div>
          <div className="sm:col-span-3">
            <Button variant="hero" onClick={() => createMutation.mutate()} disabled={!selectedVenueId || !name || !sportId || !price}>Save Court</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Price/hr</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.sportName}</TableCell>
                  <TableCell>${c.pricePerHour}</TableCell>
                  <TableCell className="text-right">
                    {/* For brevity, implement delete only */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!selectedVenueId) return;
                        try {
                          await courtsAPI.delete(selectedVenueId, c.id);
                          toast({ title: 'Deleted', description: 'Court deleted.' });
                          queryClient.invalidateQueries({ queryKey: ["owner-courts", selectedVenueId] });
                        } catch (e: any) {
                          toast({ title: 'Error', description: e.response?.data?.error || 'Failed', variant: 'destructive' });
                        }
                      }}
                    >
                      Delete
                    </Button>
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
