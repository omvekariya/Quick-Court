import { Helmet } from "react-helmet-async";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        <p className="text-sm text-muted-foreground text-center">
          No account? <Link to="/auth/signup" className="text-primary underline underline-offset-4">Sign up</Link>
        </p>
      </form>
    </main>
  );
}
