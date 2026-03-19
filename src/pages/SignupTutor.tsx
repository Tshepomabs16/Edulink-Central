import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { GraduationCap, Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignupTutor() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, null, schoolName || undefined, "tutor");
    setLoading(false);

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email!", description: "We've sent you a verification link to confirm your account." });
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden flex-1 items-center justify-center bg-gradient-hero lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl animate-pulse-glow" />
        <div className="relative max-w-md px-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-purple shadow-glow-accent">
            <Zap className="h-10 w-10 text-accent-foreground" />
          </div>
          <h2 className="mb-4 font-heading text-3xl font-bold text-foreground">Become a Tutor</h2>
          <p className="text-muted-foreground">Upload notes, schedule classes, and share video lessons to help learners across all grade levels succeed.</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="mb-6 inline-flex items-center gap-2 lg:hidden">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="font-heading text-xl font-bold">EduConnect</span>
            </Link>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Zap className="h-3 w-3" /> Tutor Account
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Create your tutor account</h1>
            <p className="mt-1 text-muted-foreground">Start sharing knowledge and making a difference</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required className="bg-secondary/50 border-border" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="bg-secondary/50 border-border" />
            </div>
            <div>
              <Label htmlFor="school">School / Institution (optional)</Label>
              <Input id="school" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Your school or institution" className="bg-secondary/50 border-border" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required className="bg-secondary/50 border-border" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required className="bg-secondary/50 border-border" />
            </div>
            <Button type="submit" variant="glow" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Create Tutor Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Are you a learner?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">Sign up as Learner</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
