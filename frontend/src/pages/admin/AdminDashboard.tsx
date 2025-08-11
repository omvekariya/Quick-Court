import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { 
  Users, 
  Building2, 
  Target, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Settings,
  Shield,
  Globe,
  Clock,
  Star,
  MapPin
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminAPI } from "@/services/api";
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

export default function AdminDashboard() {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await adminAPI.getDashboardStats();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 space-y-8">
        <Helmet>
          <title>Admin Dashboard – QuickCourt</title>
          <meta name="description" content="Global metrics and activities across QuickCourt." />
          <link rel="canonical" href="/admin/dashboard" />
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

  const { 
    overview, 
    financial, 
    userGrowth, 
    venueApprovals, 
    bookingTrends, 
    sportPopularity, 
    topVenues, 
    recentActivity, 
    venueDistribution, 
    systemHealth 
  } = statsData || {};

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
        <title>Admin Dashboard – QuickCourt</title>
        <meta name="description" content="Global metrics and activities across QuickCourt." />
        <link rel="canonical" href="/admin/dashboard" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and key performance indicators.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/admin/venues">
              <Eye className="h-4 w-4 mr-2" />
              Manage Venues
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/users">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalUsers || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {overview?.regularUsers || 0} regular • {overview?.venueOwners || 0} owners
            </div>
          </CardContent>
        </Card>

        {/* Total Venues */}
        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalVenues || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {overview?.approvedVenues || 0} approved • {overview?.pendingVenues || 0} pending
            </div>
            <Progress 
              value={overview?.totalVenues ? (overview.approvedVenues / overview.totalVenues) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financial?.totalRevenue || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              This month: {formatCurrency(financial?.revenueThisMonth || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalBookings || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {overview?.confirmedBookings || 0} confirmed • {overview?.cancelledBookings || 0} cancelled
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Trends */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <LineChartIcon className="h-5 w-5" />
              User Growth (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer className="h-64 w-full" config={{}}>
              <ResponsiveContainer>
                <AreaChart data={userGrowth || []}>
                  <defs>
                    <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <YAxis tick={CHART_STYLES.axis.tick} axisLine={CHART_STYLES.axis.axisLine} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: CHART_COLORS.primary, strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="newUsers" 
                    stroke={CHART_COLORS.primary} 
                    fill="url(#userGrowthGradient)"
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Booking Trends */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <BarChart3 className="h-5 w-5" />
              Booking Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer className="h-64 w-full" config={{}}>
              <ResponsiveContainer>
                <BarChart data={bookingTrends || []}>
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    tick={CHART_STYLES.axis.tick}
                    axisLine={CHART_STYLES.axis.axisLine}
                  />
                  <YAxis tick={CHART_STYLES.axis.tick} axisLine={CHART_STYLES.axis.axisLine} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="totalBookings" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sport Popularity & Top Venues */}
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
                      data={sportPopularity.slice(0, 6)}
                      dataKey="bookingCount"
                      nameKey="sportName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={30}
                      label={({ sportName, bookingCount }) => `${sportName}: ${bookingCount}`}
                      labelLine={true}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {sportPopularity.slice(0, 6).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
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
              <Star className="h-5 w-5" />
              Top Performing Venues
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {topVenues?.slice(0, 5).map((venue, index) => (
                <div key={venue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                    <div className="font-semibold text-green-600">{formatCurrency(venue.totalRevenue)}</div>
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

      {/* System Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Banned Users</span>
                <Badge variant="destructive">{systemHealth?.bannedUsers || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Inactive Venues</span>
                <Badge variant="secondary">{systemHealth?.inactiveVenues || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Inactive Courts</span>
                <Badge variant="secondary">{systemHealth?.inactiveCourts || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cancelled Bookings</span>
                <Badge variant="outline">{systemHealth?.cancelledBookings || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Unverified Users</span>
                <Badge variant="warning">{systemHealth?.unverifiedUsers || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Activity className="h-5 w-5" />
              Recent Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity?.slice(0, 8).map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'user_registration' ? 'bg-green-500' :
                    activity.type === 'venue_created' ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{activity.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{activity.email}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type === 'user_registration' ? 'New User' :
                     activity.type === 'venue_created' ? 'New Venue' : 'New Booking'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Venue Distribution & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venue Distribution */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <MapPin className="h-5 w-5" />
              Venue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {venueDistribution?.slice(0, 6).map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{location.location}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{location.venueCount} venues</div>
                    <div className="text-xs text-muted-foreground">
                      {location.approvedCount} approved • {location.pendingCount} pending
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
                <Link to="/admin/venues">
                  <Building2 className="h-6 w-6" />
                  <span>Manage Venues</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
                <Link to="/admin/users">
                  <Users className="h-6 w-6" />
                  <span>Manage Users</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
                <Link to="/admin/venues/pending">
                  <CheckCircle className="h-6 w-6" />
                  <span>Review Pending Venues</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Summary */}
      <Card className="border-2 border-gray-100 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="h-5 w-5" />
            Platform Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overview?.totalCourts || 0}</div>
              <p className="text-sm text-muted-foreground">Total Courts</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(financial?.averageBookingValue || 0)}</div>
              <p className="text-sm text-muted-foreground">Average Booking Value</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{sportPopularity?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Active Sports</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
