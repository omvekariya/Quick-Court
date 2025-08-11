import { Helmet } from "react-helmet-async";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react";

export default function Login() {
  const [step, setStep] = useState<'login' | 'forgot-password' | 'reset-password'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Debug logging
  console.log('Login component rendered, current step:', step);

  useEffect(() => {
    console.log('Login component mounted');
    return () => {
      console.log('Login component unmounted');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      navigate("/");
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
      // Clear password field on error
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOTP = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setSendingOTP(true);
    try {
      await authAPI.sendOTP({ email, purpose: 'reset' });
      setStep('reset-password');
      toast({
        title: "Success",
        description: "Reset code sent to your email!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send reset code",
        variant: "destructive",
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp, newPassword });
      toast({
        title: "Success",
        description: "Password reset successfully! You can now login.",
      });
      setStep('login');
      setOtp("");
      setNewPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    setStep('login');
    setOtp("");
    setNewPassword("");
  };

  if (step === 'forgot-password') {
    return (
      <main className="container mx-auto px-4 py-16 max-w-md">
        <Helmet>
          <title>Forgot Password – QuickCourt</title>
          <meta name="description" content="Reset your QuickCourt password." />
          <link rel="canonical" href="/auth/login" />
        </Helmet>

        <div className="text-center mb-6">
          <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Forgot Password?</h1>
          <p className="text-muted-foreground mt-2">
            Enter your email address and we'll send you a reset code
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input 
              id="reset-email" 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button 
            onClick={handleSendResetOTP}
            variant="hero" 
            className="w-full"
            disabled={sendingOTP || !email}
          >
            {sendingOTP ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending reset code...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Reset Code
              </>
            )}
          </Button>

          <Button 
            variant="ghost" 
            onClick={goBackToLogin}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </main>
    );
  }

  if (step === 'reset-password') {
    return (
      <main className="container mx-auto px-4 py-16 max-w-md">
        <Helmet>
          <title>Reset Password – QuickCourt</title>
          <meta name="description" content="Enter the reset code and new password." />
          <link rel="canonical" href="/auth/login" />
        </Helmet>

        <div className="text-center mb-6">
          <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="reset-otp">Reset Code</Label>
            <Input 
              id="reset-otp" 
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input 
              id="new-password" 
              type="password" 
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <Button 
            onClick={handleResetPassword}
            variant="hero" 
            className="w-full"
            disabled={loading || !otp || !newPassword}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>

          <Button 
            variant="ghost" 
            onClick={goBackToLogin}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-16 max-w-md">
      <Helmet>
        <title>Login – QuickCourt</title>
        <meta name="description" content="Login to your QuickCourt account." />
        <link rel="canonical" href="/auth/login" />
      </Helmet>
      <h1 className="text-3xl font-bold mb-6">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
        <div className="text-center space-y-2">
          <Button 
            type="button"
            variant="link" 
            onClick={() => setStep('forgot-password')}
            className="text-sm"
          >
            Forgot your password?
          </Button>
          <p className="text-sm text-muted-foreground">
            No account? <Link to="/auth/signup" className="text-primary underline underline-offset-4">Sign up</Link>
          </p>
        </div>
      </form>
    </main>
  );
}
