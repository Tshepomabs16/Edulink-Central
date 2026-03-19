import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { BookOpen, Video, FileText, Download, ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  file_url: string | null;
  video_url: string | null;
  description: string | null;
  upload_date: string;
  year: number | null;
  term: number | null;
}

export default function SubjectDetail() {
  const { subjectId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<any>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (!subjectId) return;
    const fetch = async () => {
      const [subjectRes, contentRes] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", subjectId).single(),
        supabase.from("content").select("*").eq("subject_id", subjectId).order("upload_date", { ascending: false }),
      ]);
      setSubject(subjectRes.data);
      setContent(contentRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [subjectId]);

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const notes = content.filter((c) => c.content_type === "notes");
  const videos = content.filter((c) => c.content_type === "video");
  const papers = content.filter((c) => c.content_type === "past_paper");

  const ContentCard = ({ item }: { item: ContentItem }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-gradient-card p-4 shadow-card transition-all hover:border-primary/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{item.title}</h3>
          {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(item.upload_date).toLocaleDateString()}
            {item.year && ` • ${item.year}`}
            {item.term && ` • Term ${item.term}`}
          </p>
        </div>
        <div className="flex gap-2">
          {item.file_url && (
            <a href={item.file_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline"><Download className="h-4 w-4" /></Button>
            </a>
          )}
          {item.video_url && (
            <a href={item.video_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4" /></Button>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">{subject?.subject_name}</h1>
          <p className="text-muted-foreground">Grade {subject?.grade_level} • {subject?.description}</p>
        </div>

        <Tabs defaultValue="notes">
          <TabsList className="mb-6 bg-secondary border border-border">
            <TabsTrigger value="notes" className="gap-1"><BookOpen className="h-4 w-4" /> Notes ({notes.length})</TabsTrigger>
            <TabsTrigger value="videos" className="gap-1"><Video className="h-4 w-4" /> Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="papers" className="gap-1"><FileText className="h-4 w-4" /> Past Papers ({papers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-3">
            {notes.length === 0 ? <p className="text-muted-foreground">No notes available yet.</p> : notes.map((n) => <ContentCard key={n.id} item={n} />)}
          </TabsContent>
          <TabsContent value="videos" className="space-y-3">
            {videos.length === 0 ? <p className="text-muted-foreground">No video lessons yet.</p> : videos.map((v) => <ContentCard key={v.id} item={v} />)}
          </TabsContent>
          <TabsContent value="papers" className="space-y-3">
            {papers.length === 0 ? <p className="text-muted-foreground">No past papers yet.</p> : papers.map((p) => <ContentCard key={p.id} item={p} />)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
