import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  Eye,
  UserCheck,
  UserX,
  FileCheck
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalLearners: 0,
    avgProgress: 0,
    totalXP: 0,
    pendingTasks: 0,
  });
  const [learners, setLearners] = useState<any[]>([]);
  const [pendingProofs, setPendingProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load learners
      const { data: learnersData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "learner")
        .order("xp_total", { ascending: false });
      setLearners(learnersData || []);

      // Load pending proofs
      const { data: proofsData } = await supabase
        .from("user_tasks")
        .select(`
          *,
          task:tasks(*),
          user:profiles(*)
        `)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });
      setPendingProofs(proofsData || []);

      // Calculate stats
      const totalLearners = learnersData?.length || 0;
      const avgProgress = totalLearners > 0
        ? learnersData.reduce((sum, l) => sum + (l.overall_progress || 0), 0) / totalLearners
        : 0;
      const totalXP = learnersData?.reduce((sum, l) => sum + (l.xp_total || 0), 0) || 0;
      const pendingTasks = proofsData?.length || 0;

      setStats({
        totalLearners,
        avgProgress,
        totalXP,
        pendingTasks,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProof = async (userTaskId: string, xp: number, userId: string) => {
    try {
      // Update user_task
      await supabase
        .from("user_tasks")
        .update({
          status: "approved",
          xp_granted: xp,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", userTaskId);

      // Update user XP
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp_total")
        .eq("id", userId)
        .single();

      await supabase
        .from("profiles")
        .update({
          xp_total: (profile?.xp_total || 0) + xp,
        })
        .eq("id", userId);

      toast({
        title: "تم القبول ✅",
        description: `تم منح ${xp} XP للمستخدم`,
      });

      loadData();
    } catch (error) {
      console.error("Error approving proof:", error);
      toast({
        title: "حدث خطأ",
        variant: "destructive",
      });
    }
  };

  const handleRejectProof = async (userTaskId: string) => {
    try {
      await supabase
        .from("user_tasks")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", userTaskId);

      toast({
        title: "تم الرفض",
        variant: "destructive",
      });

      loadData();
    } catch (error) {
      console.error("Error rejecting proof:", error);
    }
  };

  const handleLevelChange = async (userId: string, newLevel: "Beginner" | "Intermediate" | "Advanced") => {
    try {
      await supabase
        .from("profiles")
        .update({ level: newLevel })
        .eq("id", userId);

      toast({
        title: "تم التحديث ✅",
        description: `تم تغيير المستوى إلى ${newLevel}`,
      });

      loadData();
    } catch (error) {
      console.error("Error updating level:", error);
      toast({
        title: "حدث خطأ",
        variant: "destructive",
      });
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Advanced": return "text-success";
      case "Intermediate": return "text-info";
      default: return "text-warning";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navbar />
      
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-secondary to-primary p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">
              لوحة الإدارة 🎯
            </h1>
            <p className="text-white/90 text-lg">
              متابعة شاملة لتقدم جميع المتعلمين
            </p>
          </div>
          <div className="absolute left-0 top-0 h-full w-1/3 bg-white/10 blur-3xl"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المتعلمين</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalLearners}</div>
              <p className="text-xs text-muted-foreground mt-1">متعلم</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">متوسط التقدم</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {Math.round(stats.avgProgress)}%
              </div>
              <Progress value={stats.avgProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي XP المكتسب</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.totalXP}</div>
              <p className="text-xs text-muted-foreground mt-1">نقطة</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">قيد المراجعة</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">مهمة</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="learners" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="learners">المتعلمين</TabsTrigger>
            <TabsTrigger value="proofs">
              مراجعة الإثباتات
              {stats.pendingTasks > 0 && (
                <Badge variant="destructive" className="mr-2">
                  {stats.pendingTasks}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learners" className="space-y-4">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>قائمة المتعلمين</CardTitle>
                <CardDescription>
                  متابعة تفصيلية لجميع المتعلمين ومستوياتهم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المتعلم</TableHead>
                      <TableHead>المستوى</TableHead>
                      <TableHead>التقدم العام</TableHead>
                      <TableHead>النقاط</TableHead>
                      <TableHead>أيام متتالية</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {learners.map((learner) => (
                      <TableRow key={learner.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={learner.avatar_url} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {learner.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{learner.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                انضم {new Date(learner.join_date).toLocaleDateString("ar-SA")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={learner.level}
                            onValueChange={(value: "Beginner" | "Intermediate" | "Advanced") => handleLevelChange(learner.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">مبتدئ</SelectItem>
                              <SelectItem value="Intermediate">متوسط</SelectItem>
                              <SelectItem value="Advanced">متقدم</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {Math.round(learner.overall_progress || 0)}%
                            </div>
                            <Progress value={learner.overall_progress || 0} className="h-2 w-20" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-primary">
                            {learner.xp_total || 0} XP
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            🔥 {learner.streak_days || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/profile?userId=${learner.id}`}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            عرض الملف
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proofs" className="space-y-4">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>الإثباتات المعلقة</CardTitle>
                <CardDescription>
                  راجع وقبل أو ارفض الإثباتات المقدمة من المتعلمين
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingProofs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      لا توجد إثباتات معلقة
                    </h3>
                    <p className="text-muted-foreground">
                      جميع الإثباتات تمت مراجعتها
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingProofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar>
                              <AvatarImage src={proof.user?.avatar_url} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {proof.user?.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium">{proof.task?.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                بواسطة: {proof.user?.full_name}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline">
                                  {proof.task?.xp} XP
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  تم التقديم: {new Date(proof.submitted_at).toLocaleDateString("ar-SA")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveProof(proof.id, proof.task?.xp || 0, proof.user_id)}
                              className="gap-2"
                            >
                              <UserCheck className="h-4 w-4" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectProof(proof.id)}
                              className="gap-2"
                            >
                              <UserX className="h-4 w-4" />
                              رفض
                            </Button>
                          </div>
                        </div>
                        {proof.completion_proof && (
                          <div className="bg-muted p-3 rounded">
                            <p className="text-sm font-medium mb-1">الإثبات:</p>
                            <p className="text-sm text-muted-foreground break-all">
                              {proof.completion_proof}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;