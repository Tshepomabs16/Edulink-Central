import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Video, FileText, Users, GraduationCap, ArrowRight, Sparkles, Zap, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  { icon: BookOpen, title: "Grade-Specific Content", desc: "Access notes and study materials tailored to your exact grade level.", color: "text-primary" },
  { icon: Video, title: "Video Lessons", desc: "Watch recorded classes and video tutorials from experienced teachers.", color: "text-info" },
  { icon: FileText, title: "Past Papers", desc: "Practice with past examination papers organized by year and term.", color: "text-accent" },
  { icon: Users, title: "Live Classes", desc: "Join scheduled online classes and interact with your teachers.", color: "text-success" },
];

const stats = [
  { value: "6", label: "Grade Levels" },
  { value: "30+", label: "Subjects" },
  { value: "∞", label: "Resources" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 md:py-36">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent/5 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

        <div className="container relative mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Digital Learning for Grades 7–12
            </div>
            <h1 className="mb-6 font-heading text-5xl font-extrabold leading-tight text-foreground md:text-7xl">
              Your Gateway to
              <span className="text-gradient-primary block">Academic Excellence</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
              Access grade-specific notes, video lessons, past papers, and live classes — all in one platform built for learners.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button variant="hero" size="lg" onClick={() => navigate("/signup")} className="text-base px-8 py-3 h-auto">
                Start Learning Free <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="hero-outline" size="lg" onClick={() => navigate("/signup-tutor")} className="text-base px-8 py-3 h-auto">
                <Zap className="mr-1 h-4 w-4 text-accent" /> I'm a Tutor
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mt-16 flex max-w-md justify-center gap-8"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-heading text-3xl font-extrabold text-gradient-primary">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-4 py-24">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div className="container relative mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground">Comprehensive tools and resources for every learner</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-glow"
              >
                <div className="absolute inset-0 bg-gradient-glow opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Grades */}
      <section className="px-4 py-24">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">Grades We Support</h2>
          <p className="mb-12 text-muted-foreground">Content designed for every level of secondary education</p>
          <div className="flex flex-wrap justify-center gap-5">
            {[7, 8, 9, 10, 11, 12].map((g, i) => (
              <motion.div
                key={g}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.08, y: -4 }}
                className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-border bg-gradient-card shadow-card transition-all duration-300 hover:border-primary/40 hover:shadow-glow"
                onClick={() => navigate("/signup")}
              >
                <GraduationCap className="mb-1 h-5 w-5 text-primary" />
                <span className="font-heading text-xl font-bold text-foreground">{g}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tutor CTA */}
      <section className="px-4 py-24">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-card p-10 text-center md:p-14"
          >
            <div className="absolute inset-0 bg-gradient-glow" />
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent">
                <Shield className="h-4 w-4" /> For Tutors & Mentors
              </div>
              <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">Share Your Knowledge</h2>
              <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
                Join as a tutor to upload notes, schedule live classes, and help learners achieve their academic goals.
              </p>
              <Button variant="glow" size="lg" onClick={() => navigate("/signup-tutor")} className="text-base px-8 py-3 h-auto">
                Sign Up as Tutor <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">Ready to Start Learning?</h2>
          <p className="mb-8 text-muted-foreground">Join thousands of learners already using EduConnect to improve their grades.</p>
          <Button variant="hero" size="lg" onClick={() => navigate("/signup")} className="text-base px-8 py-3 h-auto">
            Create Your Free Account <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 px-4 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">EduConnect</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 EduConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
