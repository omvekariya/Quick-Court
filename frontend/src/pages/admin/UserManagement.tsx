import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { adminAPI } from "@/services/api";
import { Search, Users, Shield, UserCheck, UserX, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: 'user' | 'owner' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminAPI.getAllUsers,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      adminAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Filter and search users
  const filteredUsers = usersData?.data?.data?.filter((user: User) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.isActive) ||
                         (statusFilter === "inactive" && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const handleToggleBan = (user: User) => {
    const newStatus = !user.isActive;
    updateUserMutation.mutate({
      id: user.id,
      data: { isActive: newStatus }
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserMutation.mutate({
      id: userId,
      data: { role: newRole }
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'owner': return 'secondary';
      case 'user': return 'default';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'destructive';
  };

  if (error) {
    return (
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Error Loading Users</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load user data. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>User Management – QuickCourt</title>
        <meta name="description" content="Manage users and facility owners." />
        <link rel="canonical" href="/admin/users" />
      </Helmet>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredUsers.length} Users
        </Badge>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="owner">Owners</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-muted-foreground">{user.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                          disabled={updateUserMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.isActive)}>
                          {user.isActive ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Banned
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isVerified ? "default" : "secondary"}>
                          {user.isVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={user.isActive ? "destructive" : "secondary"}
                          size="sm"
                          onClick={() => handleToggleBan(user)}
                          disabled={updateUserMutation.isPending}
                        >
                          {user.isActive ? "Ban User" : "Unban User"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
