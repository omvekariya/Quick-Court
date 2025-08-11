import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  const kpis = [
    { label: "Total Users", value: "1,248" },
    { label: "Bookings (30d)", value: "3,560" },
    { label: "Active Courts", value: "142" },
    { label: "Revenue (sim)", value: "$24,300" },
  ];

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Reports & Insights – QuickCourt</title>
        <meta name="description" content="View booking activity, trends and earnings simulation." />
        <link rel="canonical" href="/admin/reports" />
      </Helmet>

      <h1 className="text-3xl font-bold">Reports & Insights</h1>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Chart coming soon.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most Active Sports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Chart coming soon.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
