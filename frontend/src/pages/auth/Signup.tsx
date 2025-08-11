import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";
import { Loader2, Mail, Shield } from "lucide-react";

export default function Signup() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "owner">("user");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!email || !fullName || !password || !role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields first",
        variant: "destructive",
      });
      return;
    }

    setSendingOTP(true);
    try {
      await authAPI.sendOTP({ email, purpose: 'verification' });
      setOtpSent(true);
      setStep('otp');
      toast({
        title: "Success",
        description: "OTP sent to your email!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verify OTP first
      await authAPI.verifyOTP({ email, otp, purpose: 'verification' });
      
      // Then register the user
      await register({
        fullName,
        email,
        password,
        phone: phone || undefined,
        role,
        otp,
      });
      
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Registration failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setSendingOTP(true);
    try {
      await authAPI.sendOTP({ email, purpose: 'verification' });
      toast({
        title: "Success",
        description: "New OTP sent to your email!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const goBackToForm = () => {
    setStep('form');
    setOtpSent(false);
    setOtp("");
  };

  if (step === 'otp') {
    return (
      <main className="container mx-auto px-4 py-16 max-w-md">
        <Helmet>
          <title>Verify Email – QuickCourt</title>
          <meta name="description" content="Verify your email to complete registration." />
          <link rel="canonical" href="/auth/signup" />
        </Helmet>

        <div className="text-center mb-6">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Verify Your Email</h1>
          <p className="text-muted-foreground mt-2">
            We've sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input 
              id="otp" 
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              required
            />
          </div>

          <Button 
            onClick={handleVerifyOTP}
            variant="hero" 
            className="w-full"
            disabled={loading || !otp}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              "Verify & Create Account"
            )}
          </Button>

          <div className="text-center space-y-2">
            <Button 
              variant="ghost" 
              onClick={handleResendOTP}
              disabled={sendingOTP}
              className="text-sm"
            >
              {sendingOTP ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Code"
              )}
            </Button>
            <div>
              <Button 
                variant="link" 
                onClick={goBackToForm}
                className="text-sm"
              >
                ← Back to form
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-16 max-w-md">
      <Helmet>
        <title>Sign up – QuickCourt</title>
        <meta name="description" content="Create your QuickCourt account." />
        <link rel="canonical" href="/auth/signup" />
      </Helmet>

      <h1 className="text-3xl font-bold mb-6">Create account</h1>

      <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input 
            id="name" 
            placeholder="Alex Player"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input 
            id="phone" 
            type="tel" 
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Account Type</Label>
          <Select value={role} onValueChange={(value: "user" | "owner") => setRole(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User - Book courts and play sports</SelectItem>
              <SelectItem value="owner">Owner - Manage venues and courts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button 
          type="submit" 
          variant="hero" 
          className="w-full"
          disabled={sendingOTP || !fullName || !email || !password}
        >
          {sendingOTP ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending verification code...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send verification code
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Already have an account? <Link to="/auth/login" className="text-primary underline underline-offset-4">Login</Link>
        </p>
      </form>
    </main>
  );
}
