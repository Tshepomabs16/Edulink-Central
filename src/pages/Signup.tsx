import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { GraduationCap, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [grade, setGrade] = useState("");
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
    if (!grade) {
      toast({ title: "Please select your grade", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, parseInt(grade), schoolName || undefined);
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
        <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="relative max-w-md px-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-accent shadow-glow">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="mb-4 font-heading text-3xl font-bold text-foreground">Join EduConnect</h2>
          <p className="text-muted-foreground">Access grade-specific learning materials, video lessons, and past papers to boost your academic journey.</p>
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
            <h1 className="font-heading text-2xl font-bold text-foreground">Create your account</h1>
            <p className="mt-1 text-muted-foreground">Start your learning journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required className="bg-secondary/50 border-border" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="bg-secondary/50 border-border" />
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="bg-secondary/50 border-border"><SelectValue placeholder="Select your grade" /></SelectTrigger>
                <SelectContent>
                  {[7, 8, 9, 10, 11, 12].map((g) => (
                    <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="school">School Name (optional)</Label>
              <Input id="school" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Your school" className="bg-secondary/50 border-border" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required className="bg-secondary/50 border-border" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required className="bg-secondary/50 border-border" />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Are you a tutor?{" "}
            <Link to="/signup-tutor" className="font-medium text-accent hover:underline">Sign up as Tutor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
