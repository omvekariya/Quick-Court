import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, Calendar, Users, DollarSign } from "lucide-react";

const data = [
  { day: "Mon", bookings: 12 },
  { day: "Tue", bookings: 18 },
  { day: "Wed", bookings: 10 },
  { day: "Thu", bookings: 20 },
  { day: "Fri", bookings: 26 },
  { day: "Sat", bookings: 35 },
  { day: "Sun", bookings: 30 },
];

export default function OwnerDashboard() {
  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Owner Dashboard – QuickCourt</title>
        <meta name="description" content="Overview of your courts, bookings and earnings." />
        <link rel="canonical" href="/owner/dashboard" />
      </Helmet>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <Button asChild>
          <Link to="/owner/venues">
            <Building2 className="h-4 w-4 mr-2" />
            Manage Venues
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold">132</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Courts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold">7</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold">$2,850</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Booking Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-72 w-full" config={{}}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </main>
  );
}
