import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Target, 
  Flame, 
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Brain,
  Globe,
  Users
} from "lucide-react";
import { formatDistance } from "date-fns";
import { ar } from "date-fns/locale";

const Dashboard = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // Load user tasks
      const { data: tasksData } = await supabase
        .from("user_tasks")
        .select(`
          *,
          task:tasks(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      setTasks(tasksData || []);

      // Load lessons
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("published", true)
        .order("order_index")
        .limit(4);
      setLessons(lessonsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyCheckin = async (trackType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Check if already checked in today
      const { data: existing } = await supabase
        .from("daily_checkin")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      const field = `${trackType}_task`;
      
      if (existing && existing[field]) {
        toast({
          title: "تم التسجيل مسبقاً",
          description: "لقد سجلت حضورك اليوم في هذا المسار",
          variant: "destructive",
        });
        return;
      }

      if (existing) {
        await supabase
          .from("daily_checkin")
          .update({
            [field]: true,
            xp_generated: (existing.xp_generated || 0) + 5,
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("daily_checkin")
          .insert({
            user_id: user.id,
            date: today,
            [field]: true,
            xp_generated: 5,
          });
      }

      // Update profile XP
      await supabase
        .from("profiles")
        .update({
          xp_total: (profile?.xp_total || 0) + 5,
        })
        .eq("id", user.id);

      toast({
        title: "رائع! 🎉",
        description: "حصلت على 5 XP من التسجيل اليومي",
      });

      loadData();
    } catch (error) {
      console.error("Error with daily checkin:", error);
    }
  };

  const getTrackIcon = (trackType: string) => {
    switch (trackType) {
      case "data": return <Brain className="h-5 w-5" />;
      case "english": return <Globe className="h-5 w-5" />;
      case "soft": return <Users className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getTrackLabel = (trackType: string) => {
    switch (trackType) {
      case "data": return "تحليل البيانات";
      case "english": return "اللغة الإنجليزية";
      case "soft": return "المهارات الناعمة";
      default: return trackType;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-24 bg-muted rounded-lg"></div>
              <div className="h-24 bg-muted rounded-lg"></div>
              <div className="h-24 bg-muted rounded-lg"></div>
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
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-secondary p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">
              مرحباً، {profile?.full_name}! 👋
            </h1>
            <p className="text-white/90 text-lg">
              لنواصل رحلة التطوير معاً
            </p>
          </div>
          <div className="absolute left-0 top-0 h-full w-1/3 bg-white/10 blur-3xl"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي النقاط</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{profile?.xp_total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">XP</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">التقدم العام</CardTitle>
              <Target className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {Math.round(profile?.overall_progress || 0)}%
              </div>
              <Progress value={profile?.overall_progress || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">أيام متتالية</CardTitle>
              <Flame className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{profile?.streak_days || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">يوم</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المستوى</CardTitle>
              <Award className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{profile?.level || "Beginner"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bars */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>تقدمك في المسارات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-medium">تحليل البيانات</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(profile?.data_progress || 0)}%
                </span>
              </div>
              <Progress value={profile?.data_progress || 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-secondary" />
                  <span className="font-medium">اللغة الإنجليزية</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(profile?.english_progress || 0)}%
                </span>
              </div>
              <Progress value={profile?.english_progress || 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-success" />
                  <span className="font-medium">المهارات الناعمة</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(profile?.soft_progress || 0)}%
                </span>
              </div>
              <Progress value={profile?.soft_progress || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Daily Check-in */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle>التسجيل اليومي السريع ⚡</CardTitle>
            <CardDescription>احصل على 5 XP لكل مسار يومياً!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handleDailyCheckin("data")}
              >
                <Brain className="h-6 w-6 text-primary" />
                <span>تحليل البيانات</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:border-secondary hover:bg-secondary/5"
                onClick={() => handleDailyCheckin("lang")}
              >
                <Globe className="h-6 w-6 text-secondary" />
                <span>اللغة الإنجليزية</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:border-success hover:bg-success/5"
                onClick={() => handleDailyCheckin("soft")}
              >
                <Users className="h-6 w-6 text-success" />
                <span>المهارات الناعمة</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tasks */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                مهامي الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد مهام بعد
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-1">
                        {getTrackIcon(task.task?.track_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium leading-tight">
                            {task.task?.title}
                          </h4>
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getTrackLabel(task.task?.track_type)} • {task.task?.xp} XP
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                دروس مقترحة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lessons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد دروس متاحة
                  </p>
                ) : (
                  lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-1">
                        {getTrackIcon(lesson.track_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium leading-tight">{lesson.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lesson.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {lesson.duration_minutes} دقيقة
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

export default Dashboard;