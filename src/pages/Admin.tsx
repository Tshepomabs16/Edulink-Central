import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Users, Calendar, BookOpen, Trash2 } from "lucide-react";

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [allContent, setAllContent] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadType, setUploadType] = useState("");
  const [uploadGrade, setUploadGrade] = useState("");
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadVideoUrl, setUploadVideoUrl] = useState("");
  const [uploadYear, setUploadYear] = useState("");
  const [uploadTerm, setUploadTerm] = useState("");
  const [uploading, setUploading] = useState(false);

  // Class form
  const [classTitle, setClassTitle] = useState("");
  const [classDesc, setClassDesc] = useState("");
  const [classGrade, setClassGrade] = useState("");
  const [classSubject, setClassSubject] = useState("");
  const [classDateTime, setClassDateTime] = useState("");
  const [classMeetingLink, setClassMeetingLink] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);

  // Grade filter for learners
  const [filterGrade, setFilterGrade] = useState("all");

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/dashboard");
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    const [subRes, learnRes, contRes, classRes] = await Promise.all([
      supabase.from("subjects").select("*").order("grade_level").order("subject_name"),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("content").select("*, subjects(subject_name)").order("upload_date", { ascending: false }).limit(50),
      supabase.from("classes").select("*, subjects(subject_name)").order("date_time", { ascending: false }).limit(50),
    ]);
    setSubjects(subRes.data || []);
    setLearners(learnRes.data || []);
    setAllContent(contRes.data || []);
    setAllClasses(classRes.data || []);
    setLoadingData(false);
  };

  const filteredSubjects = uploadGrade
    ? subjects.filter((s) => s.grade_level === parseInt(uploadGrade))
    : [];

  const classFilteredSubjects = classGrade
    ? subjects.filter((s) => s.grade_level === parseInt(classGrade))
    : [];

  const filteredLearners = filterGrade === "all"
    ? learners
    : learners.filter((l) => l.grade === parseInt(filterGrade));

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadType || !uploadGrade || !uploadSubject) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setUploading(true);

    let fileUrl: string | null = null;
    if (uploadFile) {
      const ext = uploadFile.name.split(".").pop();
      const path = `${uploadGrade}/${uploadSubject}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("content-files").upload(path, uploadFile);
      if (uploadError) {
        toast({ title: "File upload failed", description: uploadError.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("content-files").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("content").insert({
      title: uploadTitle,
      description: uploadDesc || null,
      content_type: uploadType,
      grade_level: parseInt(uploadGrade),
      subject_id: uploadSubject,
      file_url: fileUrl,
      video_url: uploadVideoUrl || null,
      uploaded_by: user!.id,
      year: uploadYear ? parseInt(uploadYear) : null,
      term: uploadTerm ? parseInt(uploadTerm) : null,
    });

    setUploading(false);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content uploaded successfully!" });
      setUploadTitle(""); setUploadDesc(""); setUploadType(""); setUploadFile(null); setUploadVideoUrl(""); setUploadYear(""); setUploadTerm("");
      fetchAll();
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classGrade || !classSubject || !classDateTime) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }
    setCreatingClass(true);
    const { error } = await supabase.from("classes").insert({
      title: classTitle,
      description: classDesc || null,
      grade_level: parseInt(classGrade),
      subject_id: classSubject,
      date_time: classDateTime,
      meeting_link: classMeetingLink || null,
      instructor_id: user!.id,
    });
    setCreatingClass(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Class scheduled!" });
      setClassTitle(""); setClassDesc(""); setClassDateTime(""); setClassMeetingLink("");
      fetchAll();
    }
  };

  const handleDeleteContent = async (id: string) => {
    const { error } = await supabase.from("content").delete().eq("id", id);
    if (!error) { toast({ title: "Deleted" }); fetchAll(); }
  };

  const handleDeleteClass = async (id: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (!error) { toast({ title: "Deleted" }); fetchAll(); }
  };

  if (authLoading || loadingData) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Admin Panel</h1>
        <p className="mb-8 text-muted-foreground">Manage content, classes, and learners</p>

        <Tabs defaultValue="upload">
          <TabsList className="mb-6 flex-wrap bg-secondary border border-border">
            <TabsTrigger value="upload" className="gap-1"><Upload className="h-4 w-4" /> Upload Content</TabsTrigger>
            <TabsTrigger value="classes" className="gap-1"><Calendar className="h-4 w-4" /> Schedule Class</TabsTrigger>
            <TabsTrigger value="learners" className="gap-1"><Users className="h-4 w-4" /> Learners</TabsTrigger>
            <TabsTrigger value="manage" className="gap-1"><BookOpen className="h-4 w-4" /> Manage Content</TabsTrigger>
          </TabsList>

          {/* Upload Content */}
          <TabsContent value="upload">
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Upload Learning Content</h2>
              <form onSubmit={handleUpload} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Title</Label>
                  <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required />
                </div>
                <div>
                  <Label>Content Type</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notes">Notes / Handout</SelectItem>
                      <SelectItem value="video">Video Lesson</SelectItem>
                      <SelectItem value="past_paper">Past Paper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grade</Label>
                  <Select value={uploadGrade} onValueChange={setUploadGrade}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {[7, 8, 9, 10, 11, 12].map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Select value={uploadSubject} onValueChange={setUploadSubject}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {filteredSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {uploadType === "past_paper" && (
                  <>
                    <div>
                      <Label>Year</Label>
                      <Input type="number" value={uploadYear} onChange={(e) => setUploadYear(e.target.value)} placeholder="e.g. 2024" />
                    </div>
                    <div>
                      <Label>Term</Label>
                      <Select value={uploadTerm} onValueChange={setUploadTerm}>
                        <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map((t) => <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {(uploadType === "notes" || uploadType === "past_paper") && (
                  <div className="sm:col-span-2">
                    <Label>Upload File (PDF, Word, PPT)</Label>
                    <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  </div>
                )}
                {uploadType === "video" && (
                  <div className="sm:col-span-2">
                    <Label>Video URL (YouTube, Vimeo, etc.)</Label>
                    <Input value={uploadVideoUrl} onChange={(e) => setUploadVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Brief description of the content" />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={uploading}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload Content
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* Schedule Class */}
          <TabsContent value="classes">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-heading text-lg font-semibold">Schedule an Online Class</h2>
              <form onSubmit={handleCreateClass} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Class Title</Label>
                  <Input value={classTitle} onChange={(e) => setClassTitle(e.target.value)} required />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Select value={classGrade} onValueChange={setClassGrade}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {[7, 8, 9, 10, 11, 12].map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Select value={classSubject} onValueChange={setClassSubject}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {classFilteredSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={classDateTime} onChange={(e) => setClassDateTime(e.target.value)} required />
                </div>
                <div>
                  <Label>Meeting Link (Zoom/Google Meet)</Label>
                  <Input value={classMeetingLink} onChange={(e) => setClassMeetingLink(e.target.value)} placeholder="https://zoom.us/j/..." />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={classDesc} onChange={(e) => setClassDesc(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={creatingClass}>
                    {creatingClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
                    Schedule Class
                  </Button>
                </div>
              </form>
            </div>

            {/* Existing classes */}
            <div className="mt-6">
              <h3 className="mb-3 font-heading font-semibold">Scheduled Classes</h3>
              {allClasses.length === 0 ? <p className="text-sm text-muted-foreground">No classes yet.</p> : (
                <div className="space-y-2">
                  {allClasses.map((cl: any) => (
                    <div key={cl.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                      <div>
                        <p className="font-medium text-foreground">{cl.title}</p>
                        <p className="text-xs text-muted-foreground">Grade {cl.grade_level} • {cl.subjects?.subject_name} • {new Date(cl.date_time).toLocaleString()}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteClass(cl.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Learners */}
          <TabsContent value="learners">
            <div className="mb-4 flex items-center gap-3">
              <Label>Filter by grade:</Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {[7, 8, 9, 10, 11, 12].map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filteredLearners.length} learners</span>
            </div>
            <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Grade</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">School</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLearners.map((l: any) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">{l.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.email}</td>
                      <td className="px-4 py-3">{l.grade}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.school_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Manage Content */}
          <TabsContent value="manage">
            <h3 className="mb-3 font-heading font-semibold">All Content ({allContent.length})</h3>
            <div className="space-y-2">
              {allContent.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <div>
                    <p className="font-medium text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">Grade {c.grade_level} • {c.subjects?.subject_name} • {c.content_type} • {new Date(c.upload_date).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteContent(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
