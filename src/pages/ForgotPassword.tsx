import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { GraduationCap, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <GraduationCap className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Reset Your Password</h1>
        {sent ? (
          <div>
            <p className="mb-6 text-muted-foreground">We've sent a reset link to <strong className="text-foreground">{email}</strong>.</p>
            <Link to="/login"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to login</Button></Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-muted-foreground">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary/50 border-border" />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
