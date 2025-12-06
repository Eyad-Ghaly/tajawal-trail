import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Award, 
  Flame, 
  Target,
  Brain,
  Globe,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  KeyRound,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userIdParam]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      
      let userId = userIdParam || user?.id;

      if (!userId) return;

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(profileData);

      // Load activities
      const { data: activitiesData } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setActivities(activitiesData || []);

      // Load user tasks
      const { data: tasksData } = await supabase
        .from("user_tasks")
        .select(`
          *,
          task:tasks(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setUserTasks(tasksData || []);

      // Load custom lessons
      const { data: customLessonsData } = await supabase
        .from("custom_lessons")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setCustomLessons(customLessonsData || []);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمتا المرور غير متطابقتين",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "تم بنجاح!",
        description: "تم تحديث كلمة المرور بنجاح",
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success text-white";
      case "submitted": return "bg-info text-white";
      case "rejected": return "bg-destructive text-white";
      default: return "bg-warning text-white";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "مقبول";
      case "submitted": return "قيد المراجعة";
      case "rejected": return "مرفوض";
      default: return "معلق";
    }
  };

  const isOwnProfile = !userIdParam || userIdParam === currentUserId;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container py-8 space-y-8">
        {/* Profile Header */}
        <Card className="border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-right space-y-3">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{profile?.full_name}</h1>
                  <Badge variant="outline" className="text-base">
                    {profile?.level}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium">{profile?.xp_total || 0} XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-secondary" />
                    <span className="font-medium">
                      {Math.round(profile?.overall_progress || 0)}% تقدم
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-warning" />
                    <span className="font-medium">{profile?.streak_days || 0} يوم متتالي</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-primary" />
                تحليل البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>التقدم</span>
                  <span className="font-medium">
                    {Math.round(profile?.data_progress || 0)}%
                  </span>
                </div>
                <Progress value={profile?.data_progress || 0} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-secondary" />
                اللغة الإنجليزية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>التقدم</span>
                  <span className="font-medium">
                    {Math.round(profile?.english_progress || 0)}%
                  </span>
                </div>
                <Progress value={profile?.english_progress || 0} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-success" />
                المهارات الناعمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>التقدم</span>
                  <span className="font-medium">
                    {Math.round(profile?.soft_progress || 0)}%
                  </span>
                </div>
                <Progress value={profile?.soft_progress || 0} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Change Password Section - Only for own profile */}
        {isOwnProfile && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                تغيير كلمة المرور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={passwordLoading}
                      dir="ltr"
                      className="text-left pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={passwordLoading}
                      dir="ltr"
                      className="text-left pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <KeyRound className="ml-2 h-4 w-4" />
                      تحديث كلمة المرور
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Custom Lessons Section */}
        {customLessons.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-warning" />
                الدروس المخصصة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التقدم</span>
                    <span className="font-medium">
                      {customLessons.filter(l => l.completed).length} / {customLessons.length}
                      {" "}({Math.round((customLessons.filter(l => l.completed).length / customLessons.length) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(customLessons.filter(l => l.completed).length / customLessons.length) * 100} 
                  />
                </div>
                
                {/* Lessons list */}
                <div className="grid gap-3 md:grid-cols-2">
                  {customLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`p-3 rounded-lg border ${lesson.completed ? 'bg-success/10 border-success' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 
                          className={`h-4 w-4 mt-0.5 ${lesson.completed ? 'text-success' : 'text-muted-foreground'}`} 
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                          {lesson.video_link && (
                            <a
                              href={lesson.video_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-1 inline-block"
                            >
                              رابط الفيديو
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tasks History */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                سجل المهام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد مهام بعد
                  </p>
                ) : (
                  userTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-sm leading-tight">
                          {task.task?.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(task.status)} variant="secondary">
                            {getStatusLabel(task.status)}
                          </Badge>
                          {task.xp_granted && (
                            <span className="text-xs text-success">
                              +{task.xp_granted} XP
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleDateString("ar-SA")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activities Timeline */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                النشاطات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد نشاطات بعد
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.xp_earned > 0 && (
                            <span className="text-xs text-success">
                              +{activity.xp_earned} XP
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;