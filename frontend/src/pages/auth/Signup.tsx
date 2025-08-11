import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register({
        fullName,
        email,
        password,
        phone: phone || undefined,
      });
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-16 max-w-md">
      <Helmet>
        <title>Sign up – QuickCourt</title>
        <meta name="description" content="Create your QuickCourt account." />
        <link rel="canonical" href="/auth/signup" />
      </Helmet>

      <h1 className="text-3xl font-bold mb-6">Create account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          {loading ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Already have an account? <Link to="/auth/login" className="text-primary underline underline-offset-4">Login</Link>
        </p>
      </form>
    </main>
  );
}
