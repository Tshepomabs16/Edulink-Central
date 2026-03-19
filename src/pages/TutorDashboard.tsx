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
import { Loader2, Upload, Calendar, BookOpen, Trash2, Zap, Pencil, Save, X } from "lucide-react";

export default function TutorDashboard() {
  const { user, isTutor, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [myContent, setMyContent] = useState<any[]>([]);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Upload form
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

  // Edit content state
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editTerm, setEditTerm] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (!isTutor && !isAdmin))) navigate("/dashboard");
  }, [user, isTutor, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!user || (!isTutor && !isAdmin)) return;
    fetchAll();
  }, [user, isTutor, isAdmin]);

  const fetchAll = async () => {
    if (!user) return;

    try {
      setLoadingData(true);

      const [subRes, contRes, classRes] = await Promise.all([
        supabase.from("subjects").select("*").order("grade_level").order("subject_name"),
        supabase.from("content").select("*, subjects(subject_name)").eq("uploaded_by", user.id).order("upload_date", { ascending: false }),
        supabase.from("classes").select("*, subjects(subject_name)").eq("instructor_id", user.id).order("date_time", { ascending: false }),
      ]);

      setSubjects(subRes.data || []);
      setMyContent(contRes.data || []);
      setMyClasses(classRes.data || []);
    } finally {
      setLoadingData(false);
    }
  };

  const filteredSubjects = uploadGrade ? subjects.filter((s) => s.grade_level === parseInt(uploadGrade)) : [];
  const classFilteredSubjects = classGrade ? subjects.filter((s) => s.grade_level === parseInt(classGrade)) : [];

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
      setUploadTitle("");
      setUploadDesc("");
      setUploadType("");
      setUploadGrade("");
      setUploadSubject("");
      setUploadFile(null);
      setUploadVideoUrl("");
      setUploadYear("");
      setUploadTerm("");
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
      setClassTitle("");
      setClassDesc("");
      setClassGrade("");
      setClassSubject("");
      setClassDateTime("");
      setClassMeetingLink("");
      fetchAll();
    }
  };

  const handleDeleteContent = async (id: string) => {
    const { error } = await supabase.from("content").delete().eq("id", id);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Deleted" });

    if (editingContentId === id) {
      cancelEditContent();
    }

    fetchAll();
  };

  const handleDeleteClass = async (id: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", id);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Deleted" });
    fetchAll();
  };

  const startEditContent = (content: any) => {
    setEditingContentId(content.id);
    setEditTitle(content.title || "");
    setEditDesc(content.description || "");
    setEditType(content.content_type || "");
    setEditYear(content.year ? String(content.year) : "");
    setEditTerm(content.term ? String(content.term) : "");
  };

  const cancelEditContent = () => {
    setEditingContentId(null);
    setEditTitle("");
    setEditDesc("");
    setEditType("");
    setEditYear("");
    setEditTerm("");
  };

  const handleUpdateContent = async (id: string) => {
    if (!editTitle.trim() || !editType) {
      toast({ title: "Title and content type are required", variant: "destructive" });
      return;
    }

    setSavingEdit(true);

    const payload: any = {
      title: editTitle.trim(),
      description: editDesc.trim() || null,
      content_type: editType,
      year: editYear ? parseInt(editYear) : null,
      term: editTerm ? parseInt(editTerm) : null,
    };

    if (editType !== "past_paper") {
      payload.year = null;
      payload.term = null;
    }

    const { error } = await supabase.from("content").update(payload).eq("id", id);

    setSavingEdit(false);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Content updated successfully!" });
    cancelEditContent();
    fetchAll();
  };

  if (authLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-purple shadow-glow-accent">
            <Zap className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Tutor Dashboard</h1>
            <p className="text-muted-foreground">Upload content and schedule classes for learners</p>
          </div>
        </div>

        <Tabs defaultValue="upload">
          <TabsList className="mb-6 flex-wrap border border-border bg-secondary">
            <TabsTrigger value="upload" className="gap-1">
              <Upload className="h-4 w-4" /> Upload Content
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-1">
              <Calendar className="h-4 w-4" /> Schedule Class
            </TabsTrigger>
            <TabsTrigger value="my-content" className="gap-1">
              <BookOpen className="h-4 w-4" /> My Content
            </TabsTrigger>
          </TabsList>

          {/* Upload */}
          <TabsContent value="upload">
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Upload Learning Content</h2>
              <form onSubmit={handleUpload} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Title</Label>
                  <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required className="border-border bg-secondary/50" />
                </div>

                <div>
                  <Label>Content Type</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger className="border-border bg-secondary/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
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
                    <SelectTrigger className="border-border bg-secondary/50">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {[7, 8, 9, 10, 11, 12].map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          Grade {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Select value={uploadSubject} onValueChange={setUploadSubject}>
                    <SelectTrigger className="border-border bg-secondary/50">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {uploadType === "past_paper" && (
                  <>
                    <div>
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={uploadYear}
                        onChange={(e) => setUploadYear(e.target.value)}
                        placeholder="e.g. 2024"
                        className="border-border bg-secondary/50"
                      />
                    </div>

                    <div>
                      <Label>Term</Label>
                      <Select value={uploadTerm} onValueChange={setUploadTerm}>
                        <SelectTrigger className="border-border bg-secondary/50">
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map((t) => (
                            <SelectItem key={t} value={String(t)}>
                              Term {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {(uploadType === "notes" || uploadType === "past_paper") && (
                  <div className="sm:col-span-2">
                    <Label>Upload File (PDF, Word, PPT)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="border-border bg-secondary/50"
                    />
                  </div>
                )}

                {uploadType === "video" && (
                  <div className="sm:col-span-2">
                    <Label>Video URL</Label>
                    <Input
                      value={uploadVideoUrl}
                      onChange={(e) => setUploadVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="border-border bg-secondary/50"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="Brief description"
                    className="border-border bg-secondary/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button type="submit" variant="hero" disabled={uploading}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload Content
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* Schedule Class */}
          <TabsContent value="classes">
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Schedule an Online Class</h2>
              <form onSubmit={handleCreateClass} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Class Title</Label>
                  <Input value={classTitle} onChange={(e) => setClassTitle(e.target.value)} required className="border-border bg-secondary/50" />
                </div>

                <div>
                  <Label>Grade</Label>
                  <Select value={classGrade} onValueChange={setClassGrade}>
                    <SelectTrigger className="border-border bg-secondary/50">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {[7, 8, 9, 10, 11, 12].map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          Grade {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Select value={classSubject} onValueChange={setClassSubject}>
                    <SelectTrigger className="border-border bg-secondary/50">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {classFilteredSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={classDateTime}
                    onChange={(e) => setClassDateTime(e.target.value)}
                    required
                    className="border-border bg-secondary/50"
                  />
                </div>

                <div>
                  <Label>Meeting Link</Label>
                  <Input
                    value={classMeetingLink}
                    onChange={(e) => setClassMeetingLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="border-border bg-secondary/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={classDesc} onChange={(e) => setClassDesc(e.target.value)} className="border-border bg-secondary/50" />
                </div>

                <div className="sm:col-span-2">
                  <Button type="submit" variant="hero" disabled={creatingClass}>
                    {creatingClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
                    Schedule Class
                  </Button>
                </div>
              </form>
            </div>

            {myClasses.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 font-heading font-semibold text-foreground">My Scheduled Classes</h3>
                <div className="space-y-2">
                  {myClasses.map((cl: any) => (
                    <div key={cl.id} className="flex items-center justify-between rounded-xl border border-border bg-gradient-card p-3">
                      <div>
                        <p className="font-medium text-foreground">{cl.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Grade {cl.grade_level} • {cl.subjects?.subject_name} • {new Date(cl.date_time).toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteClass(cl.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* My Content */}
          <TabsContent value="my-content">
            <h3 className="mb-3 font-heading font-semibold text-foreground">My Uploaded Content ({myContent.length})</h3>

            {myContent.length === 0 ? (
              <div className="rounded-2xl border border-border bg-gradient-card p-6 text-center">
                <p className="text-muted-foreground">You haven't uploaded any content yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myContent.map((c: any) => {
                  const isEditing = editingContentId === c.id;

                  return (
                    <div key={c.id} className="rounded-xl border border-border bg-gradient-card p-4 shadow-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Grade {c.grade_level} • {c.subjects?.subject_name} • {c.content_type}
                          </p>
                          {c.description && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border bg-background/60 hover:bg-secondary"
                            onClick={() => (isEditing ? cancelEditContent() : startEditContent(c))}
                          >
                            {isEditing ? <X className="mr-1 h-4 w-4" /> : <Pencil className="mr-1 h-4 w-4" />}
                            {isEditing ? "Cancel" : "Edit"}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-destructive/10"
                            onClick={() => handleDeleteContent(c.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-4 rounded-xl border border-border/70 bg-background/40 p-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <Label>Title</Label>
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="border-border bg-secondary/50"
                              />
                            </div>

                            <div>
                              <Label>Content Type</Label>
                              <Select value={editType} onValueChange={setEditType}>
                                <SelectTrigger className="border-border bg-secondary/50">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="notes">Notes / Handout</SelectItem>
                                  <SelectItem value="video">Video Lesson</SelectItem>
                                  <SelectItem value="past_paper">Past Paper</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {editType === "past_paper" && (
                              <>
                                <div>
                                  <Label>Year</Label>
                                  <Input
                                    type="number"
                                    value={editYear}
                                    onChange={(e) => setEditYear(e.target.value)}
                                    placeholder="e.g. 2024"
                                    className="border-border bg-secondary/50"
                                  />
                                </div>

                                <div>
                                  <Label>Term</Label>
                                  <Select value={editTerm} onValueChange={setEditTerm}>
                                    <SelectTrigger className="border-border bg-secondary/50">
                                      <SelectValue placeholder="Select term" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1, 2, 3, 4].map((t) => (
                                        <SelectItem key={t} value={String(t)}>
                                          Term {t}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}

                            <div className="sm:col-span-2">
                              <Label>Description</Label>
                              <Textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Update description"
                                className="border-border bg-secondary/50"
                              />
                            </div>

                            <div className="sm:col-span-2 flex gap-2">
                              <Button
                                type="button"
                                variant="hero"
                                onClick={() => handleUpdateContent(c.id)}
                                disabled={savingEdit}
                              >
                                {savingEdit ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="mr-2 h-4 w-4" />
                                )}
                                Save Changes
                              </Button>

                              <Button type="button" variant="outline" onClick={cancelEditContent}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}