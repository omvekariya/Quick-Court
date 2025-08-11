import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const data = [
  { label: "Users", value: 1240 },
  { label: "Owners", value: 62 },
  { label: "Bookings", value: 980 },
  { label: "Courts", value: 215 },
];

export default function AdminDashboard() {
  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Admin Dashboard – QuickCourt</title>
        <meta name="description" content="Global metrics and activities across QuickCourt." />
        <link rel="canonical" href="/admin/dashboard" />
      </Helmet>

      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {data.map((d) => (
          <Card key={d.label}>
            <CardHeader>
              <CardTitle>{d.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold">{d.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-72 w-full" config={{}}>
            <ResponsiveContainer>
              <BarChart data={data}>
                <XAxis dataKey="label" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </main>
  );
}
