import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { HelmetProvider } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Venues from "@/pages/Venues";
import VenueDetails from "@/pages/VenueDetails";
import BookCourt from "@/pages/BookCourt";
import MyBookings from "@/pages/MyBookings";
import Profile from "@/pages/Profile";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import OwnerDashboard from "@/pages/owner/OwnerDashboard";
import VenueManagement from "@/pages/owner/VenueManagement";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import FacilityManagement from "@/pages/owner/FacilityManagement";
import CourtManagement from "@/pages/owner/CourtManagement";
import TimeSlotManagement from "@/pages/owner/TimeSlotManagement";
import BookingsOverview from "@/pages/owner/BookingsOverview";
import FacilityApproval from "@/pages/admin/FacilityApproval";
import UserManagement from "@/pages/admin/UserManagement";
import Reports from "@/pages/admin/Reports";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HelmetProvider>
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venue/:id" element={<VenueDetails />} />
              
              {/* Protected Routes */}
              <Route path="/book/:id" element={
                <ProtectedRoute>
                  <BookCourt />
                </ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Auth Routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />

              {/* Owner Routes */}
              <Route path="/owner/dashboard" element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/owner/venues" element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <VenueManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/courts" element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <CourtManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/time-slots" element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <TimeSlotManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/bookings" element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <BookingsOverview />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/facility-approval" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <FacilityApproval />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </HelmetProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
