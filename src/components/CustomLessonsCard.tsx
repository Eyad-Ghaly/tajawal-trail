import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ExternalLink } from "lucide-react";

interface CustomLesson {
  id: string;
  title: string;
  description: string | null;
  video_link: string | null;
  completed: boolean;
}

interface CustomLessonsCardProps {
  lessons: CustomLesson[];
  onUpdate: () => void;
}

export const CustomLessonsCard = ({ lessons, onUpdate }: CustomLessonsCardProps) => {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (lessons.length === 0) return null;

  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = (completedCount / lessons.length) * 100;

  const handleToggleComplete = async (lessonId: string, currentStatus: boolean) => {
    setUpdatingId(lessonId);
    
    const { error } = await supabase
      .from("custom_lessons")
      .update({ 
        completed: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null
      })
      .eq("id", lessonId);

    if (error) {
      toast({
        title: "حدث خطأ",
        variant: "destructive",
      });
    } else {
      toast({
        title: !currentStatus ? "تم إكمال الدرس ✅" : "تم إلغاء الإكمال",
      });
      onUpdate();
    }
    setUpdatingId(null);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-warning" />
          الدروس المخصصة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>التقدم</span>
            <span className="font-medium">
              {completedCount} / {lessons.length} ({Math.round(progress)}%)
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                lesson.completed ? "bg-success/10 border-success" : "hover:bg-muted/50"
              }`}
            >
              <Checkbox
                checked={lesson.completed}
                disabled={updatingId === lesson.id}
                onCheckedChange={() => handleToggleComplete(lesson.id, lesson.completed)}
                className="mt-1"
              />
              <div className="flex-1">
                <h4 className={`font-medium text-sm ${lesson.completed ? "line-through text-muted-foreground" : ""}`}>
                  {lesson.title}
                </h4>
                {lesson.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {lesson.description}
                  </p>
                )}
                {lesson.video_link && (
                  <a
                    href={lesson.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    رابط الفيديو
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
