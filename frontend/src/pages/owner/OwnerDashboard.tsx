import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Star, 
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Settings,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ownerAPI } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Color palette for charts - using vibrant, visible colors
const CHART_COLORS = {
  primary: "#3b82f6",      // Bright blue
  secondary: "#10b981",     // Bright green
  accent: "#f59e0b",        // Bright orange
  success: "#059669",        // Dark green
  warning: "#d97706",        // Dark orange
  destructive: "#dc2626",    // Bright red
  muted: "#6b7280",         // Gray
  border: "#d1d5db"         // Light gray
};

const PIE_CHART_COLORS = [
  "#3b82f6",  // Blue
  "#10b981",  // Green
  "#f59e0b",  // Orange
  "#8b5cf6",  // Purple
  "#ef4444",  // Red
  "#06b6d4",  // Cyan
  "#f97316",  // Bright orange
  "#84cc16"   // Lime
];

// Additional chart styling
const CHART_STYLES = {
  axis: {
    tick: { fill: '#6b7280', fontSize: 12, fontWeight: 500 },
    axisLine: { stroke: '#d1d5db', strokeWidth: 1 }
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  }
};

export default function OwnerDashboard() {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['owner-dashboard-stats'],
    queryFn: async () => {
      const response = await ownerAPI.getDashboardStats();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 space-y-8">
        <Helmet>
          <title>Owner Dashboard – QuickCourt</title>
          <meta name="description" content="Overview of your courts, bookings and earnings." />
          <link rel="canonical" href="/owner/dashboard" />
        </Helmet>

        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-10">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Unable to load dashboard</h2>
          <p className="text-muted-foreground mb-6">There was an error loading your dashboard data.</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </main>
    );
  }

  const { overview, financial, venuePerformance, courtUtilization, trends, peakHours, sportPopularity, customerInsights } = statsData || {};

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get growth indicator
  const GrowthIndicator = ({ value, type = 'text' }: { value: number; type?: 'text' | 'icon' }) => {
    if (value === 0) return <span className="text-muted-foreground">0%</span>;
    
    const isPositive = value > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />;
    
    if (type === 'icon') return <span className={color}>{icon}</span>;
    return <span className={color}>{formatPercentage(value)}</span>;
  };

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Owner Dashboard – QuickCourt</title>
        <meta name="description" content="Overview of your courts, bookings and earnings." />
        <link rel="canonical" href="/owner/dashboard" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your venues.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/owner/venues">
              <Eye className="h-4 w-4 mr-2" />
              View Venues
            </Link>
          </Button>
          <Button asChild>
            <Link to="/owner/venues">
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financial?.totalEarnings || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <GrowthIndicator value={overview?.revenueGrowthRate || 0} type="icon" />
              <span className="ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalBookings || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <GrowthIndicator value={overview?.bookingGrowthRate || 0} type="icon" />
              <span className="ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Courts */}
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.activeCourts || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              of {overview?.totalCourts || 0} total courts
            </div>
            <Progress 
              value={overview?.totalCourts ? (overview.activeCourts / overview.totalCourts) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        {/* Average Booking Value */}
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Booking</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financial?.averageBookingValue || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              per booking
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <LineChartIcon className="h-5 w-5" />
              Revenue Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer className="h-64 w-full" config={{}}>
              <ResponsiveContainer>
                <AreaChart data={trends || []}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    tick={CHART_STYLES.axis.tick}
                    axisLine={CHART_STYLES.axis.axisLine}
                  />
                  <YAxis 
                    tick={CHART_STYLES.axis.tick}
                    axisLine={CHART_STYLES.axis.axisLine}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: CHART_COLORS.primary, strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={CHART_COLORS.primary} 
                    fill="url(#revenueGradient)"
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Clock className="h-5 w-5" />
              Peak Hours Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer className="h-64 w-full" config={{}}>
              <ResponsiveContainer>
                <BarChart data={peakHours || []}>
                  <XAxis 
                    dataKey="hour" 
                    tick={CHART_STYLES.axis.tick}
                    axisLine={CHART_STYLES.axis.axisLine}
                  />
                  <YAxis 
                    tick={CHART_STYLES.axis.tick}
                    axisLine={CHART_STYLES.axis.axisLine}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar 
                    dataKey="bookingCount" 
                    fill={CHART_COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                    stroke={CHART_COLORS.success}
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sport Popularity & Venue Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sport Popularity */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <PieChartIcon className="h-5 w-5" />
              Sport Popularity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {sportPopularity && sportPopularity.length > 0 ? (
              <ChartContainer className="h-64 w-full" config={{}}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={sportPopularity}
                      dataKey="bookingCount"
                      nameKey="sportName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={30}
                      label={({ sportName, bookingCount, percent }) => 
                        `${sportName}: ${bookingCount} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={true}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {sportPopularity.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No sport data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Venues */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Building2 className="h-5 w-5" />
              Top Performing Venues
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {venuePerformance?.slice(0, 5).map((venue, index) => (
                <div key={venue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{venue.venueName}</div>
                      <div className="text-sm text-muted-foreground">
                        {venue.courtCount} courts • {venue.bookingCount} bookings
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">{formatCurrency(venue.venueEarnings)}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      {venue.rating?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* This Month vs Last Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="font-semibold">{formatCurrency(financial?.earningsThisMonth || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Month</span>
              <span className="font-semibold">{formatCurrency(financial?.earningsLastMonth || 0)}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Growth</span>
                <GrowthIndicator value={
                  financial?.earningsLastMonth ? 
                  ((financial.earningsThisMonth - financial.earningsLastMonth) / financial.earningsLastMonth * 100) : 0
                } />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Court Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Court Utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Courts</span>
              <span className="font-semibold text-green-600">{overview?.activeCourts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Inactive Courts</span>
              <span className="font-semibold text-red-600">{overview?.inactiveCourts || 0}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Utilization Rate</span>
                <span className="font-semibold">
                  {overview?.totalCourts ? Math.round((overview.activeCourts / overview.totalCourts) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Last 7 days:</span>
              <span className="font-medium">{overview?.bookingsLast7Days || 0} bookings</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Last 30 days:</span>
              <span className="font-medium">{overview?.bookingsLast30Days || 0} bookings</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-muted-foreground">Total venues:</span>
              <span className="font-medium">{overview?.totalVenues || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers (Last 90 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Customer</th>
                  <th className="text-left py-3 px-2 font-medium">Bookings</th>
                  <th className="text-left py-3 px-2 font-medium">Total Spent</th>
                  <th className="text-left py-3 px-2 font-medium">Last Booking</th>
                </tr>
              </thead>
              <tbody>
                {customerInsights?.map((customer, index) => (
                  <tr key={customer.customerEmail} className="border-b">
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium">{customer.customerName}</div>
                        <div className="text-sm text-muted-foreground">{customer.customerEmail}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="secondary">{customer.bookingCount} bookings</Badge>
                    </td>
                    <td className="py-3 px-2 font-semibold">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {customer.lastBooking ? format(new Date(customer.lastBooking), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
              <Link to="/owner/venues">
                <Building2 className="h-6 w-6" />
                <span>Manage Venues</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
              <Link to="/owner/bookings">
                <Calendar className="h-6 w-6" />
                <span>View Bookings</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
              <Link to="/owner/courts">
                <Target className="h-6 w-6" />
                <span>Manage Courts</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
              <Link to="/owner/slots">
                <Clock className="h-6 w-6" />
                <span>Time Slots</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
