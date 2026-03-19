import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { BookOpen, Video, FileText, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

interface Subject {
  id: string;
  subject_name: string;
  grade_level: number;
  description: string | null;
  icon_name: string | null;
}

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  upload_date: string;
  subjects: { subject_name: string } | null;
}

interface ClassItem {
  id: string;
  title: string;
  date_time: string;
  meeting_link: string | null;
  subjects: { subject_name: string } | null;
}

function getIcon(iconName: string | null) {
  if (!iconName) return BookOpen;
  const formatted = iconName.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return (LucideIcons as any)[formatted] || BookOpen;
}

export default function Dashboard() {
  const { user, profile, isTutor, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (!authLoading && isAdmin) navigate("/admin");
    if (!authLoading && isTutor) navigate("/tutor");
  }, [user, authLoading, isAdmin, isTutor]);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      const [subjectsRes, contentRes, classesRes] = await Promise.all([
        supabase.from("subjects").select("*").eq("grade_level", profile.grade!).order("subject_name"),
        supabase.from("content").select("id, title, content_type, upload_date, subjects(subject_name)").eq("grade_level", profile.grade!).order("upload_date", { ascending: false }).limit(6),
        supabase.from("classes").select("id, title, date_time, meeting_link, subjects(subject_name)").eq("grade_level", profile.grade!).gte("date_time", new Date().toISOString()).order("date_time").limit(4),
      ]);
      setSubjects(subjectsRes.data || []);
      setRecentContent(contentRes.data as any || []);
      setUpcomingClasses(classesRes.data as any || []);
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const contentTypeIcon = (type: string) => {
    if (type === "video") return <Video className="h-4 w-4 text-info" />;
    if (type === "past_paper") return <FileText className="h-4 w-4 text-primary" />;
    return <BookOpen className="h-4 w-4 text-success" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0]}! 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Grade {profile?.grade} • Here's what's new for you</p>
        </motion.div>

        {/* Subjects */}
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Your Subjects</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s, i) => {
              const Icon = getIcon(s.icon_name);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/subject/${s.id}`)}
                  className="group cursor-pointer rounded-2xl border border-border bg-gradient-card p-5 shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-glow"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground">{s.subject_name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  <div className="mt-3 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    View content <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Recent + Upcoming */}
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Recent Content</h2>
            {recentContent.length === 0 ? (
              <div className="rounded-2xl border border-border bg-gradient-card p-6 text-center">
                <p className="text-muted-foreground">No content uploaded yet for your grade.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContent.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-gradient-card p-4 shadow-card transition-all hover:border-border/80">
                    {contentTypeIcon(c.content_type)}
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.subjects?.subject_name} • {new Date(c.upload_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Upcoming Classes</h2>
            {upcomingClasses.length === 0 ? (
              <div className="rounded-2xl border border-border bg-gradient-card p-6 text-center">
                <p className="text-muted-foreground">No upcoming classes scheduled.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((cl) => (
                  <div key={cl.id} className="flex items-center gap-3 rounded-xl border border-border bg-gradient-card p-4 shadow-card">
                    <Calendar className="h-4 w-4 text-info" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{cl.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {cl.subjects?.subject_name} • {new Date(cl.date_time).toLocaleString()}
                      </p>
                    </div>
                    {cl.meeting_link && (
                      <a href={cl.meeting_link} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">Join</Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
