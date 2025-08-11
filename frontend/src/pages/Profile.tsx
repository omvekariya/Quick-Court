import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, User, Shield, Mail, Phone, Calendar, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { authAPI } from "@/services/api";

export default function Profile() {
  const { user, updateProfile, loading } = useAuth();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateProfile({
        fullName,
        phone: phone || undefined,
      });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'owner':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to view your profile.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
      <Helmet>
        <title>Profile – QuickCourt</title>
        <meta name="description" content="View and edit your QuickCourt profile." />
        <link rel="canonical" href="/profile" />
      </Helmet>

      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profileImage} alt={user.fullName} />
                <AvatarFallback className="text-lg">
                  {user.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">{user.fullName}</h3>
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              {user.isVerified && (
                <Badge className="bg-green-100 text-green-800">
                  Verified
                </Badge>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="md:col-span-2">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user.email} 
                      disabled 
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!isEditing}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button 
                          onClick={handleSave}
                          variant="hero"
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setFullName(user.fullName);
                            setPhone(user.phone || "");
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setIsEditing(true)}
                        variant="hero"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Account Security Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Account Security</h4>
                    <p className="text-sm text-muted-foreground">
                      Your account is secured with JWT authentication and password hashing.
                    </p>
                  </div>

                  {/* Change Password Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Change Password
                    </h4>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input 
                            id="currentPassword" 
                            type={showPasswords ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPasswords(!showPasswords)}
                          >
                            {showPasswords ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleChangePassword}
                        variant="hero"
                        disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                      >
                        {changingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Changing Password...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Role & Permissions */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Role & Permissions</h4>
                    <p className="text-sm text-muted-foreground">
                      Current role: <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.role === 'admin' && 'You have full system access and can manage all users and venues.'}
                      {user.role === 'owner' && 'You can manage your venues, courts, and view booking analytics.'}
                      {user.role === 'user' && 'You can book courts, manage your bookings, and write reviews.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
