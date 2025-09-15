import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { apiClient, GenerateAudioResponse, GenerateSummaryResponse } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  X, 
  Sparkles, 
  Volume2, 
  CreditCard,
  Loader2,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

interface NoteEditorProps {
  note: any;
  categories: any[];
  onSave: () => void;
  onClose: () => void;
}

export const NoteEditor = ({ note, categories, onSave, onClose }: NoteEditorProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [summary, setSummary] = useState(note.summary || "");
  const [categoryId, setCategoryId] = useState(note.category_id || "");
  const [flashcards, setFlashcards] = useState<any[]>([]);
  
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (note.id !== 'new') {
      loadFlashcards();
    }
  }, [note.id]);

  const loadFlashcards = async () => {
    if (note.id === 'new') return;
    
    try {
      const data = await apiClient.getFlashcardsByNoteId(note.id);
      setFlashcards(data);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (note.id === 'new') {
        await apiClient.createNote({
          title: title.trim(),
          content: content.trim(),
          summary: summary.trim() || undefined,
          categoryId: categoryId || undefined,
          audioUrl: audioUrl || undefined,
        });
      } else {
        await apiClient.updateNote(note.id, {
          title: title.trim(),
          content: content.trim(),
          summary: summary.trim() || undefined,
          categoryId: categoryId || undefined,
          audioUrl: audioUrl || undefined,
        });
      }

      toast({
        title: "Sucesso!",
        description: "Anotação salva com sucesso.",
      });
      
      onSave();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar a anotação",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateSummary = async () => {
    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "Adicione conteúdo antes de gerar o resumo",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSummary(true);

    try {
      let summaryResponse : GenerateSummaryResponse;

      if (note?.id){
        summaryResponse = await apiClient.generateNoteSummary(note.id);
      } else {
        summaryResponse = await apiClient.generateSummary({
          content: content.trim()
        });
      }

      setSummary(summaryResponse.summary);
      
      toast({
        title: "Sucesso!",
        description: "Resumo gerado com sucesso.",
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o resumo",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateAudio = async () => {
    const textToConvert = summary || content;
    if (!textToConvert.trim()) {
      toast({
        title: "Erro",
        description: "Adicione conteúdo ou gere um resumo primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      let audioResponse : GenerateAudioResponse;

      audioResponse = await apiClient.generateAudio({
        text: textToConvert.trim(),
        voice: 'burt'
      });

      // Convert base64 to blob and create URL
      const binaryString = atob(audioResponse.audioContent);

      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      toast({
        title: "Sucesso!",
        description: "Áudio gerado com sucesso.",
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o áudio",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const generateFlashcards = async () => {
    const textToUse = summary || content;
    if (!textToUse.trim()) {
      toast({
        title: "Erro",
        description: "Adicione conteúdo antes de gerar flashcards",
        variant: "destructive",
      });
      return;
    }

    if (note.id === 'new') {
      toast({
        title: "Erro",
        description: "Salve a anotação antes de gerar flashcards",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingFlashcards(true);
    try {
      const flashcards = await apiClient.generateNoteFlashcards(note.id);

      await loadFlashcards();
      
      toast({
        title: "Sucesso!",
        description: `${flashcards.length} flashcards gerados com sucesso.`,
      });
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível gerar os flashcards",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const toggleAudio = () => {
    if (!audioUrl) return;

    if (!audioElement) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const resetAudio = () => {
    if (audioElement) {
      audioElement.currentTime = 0;
      if (isPlaying) {
        audioElement.play();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da anotação..."
              className="text-lg font-semibold"
            />
            
            <Select value={categoryId || "none"} onValueChange={(value) => setCategoryId(value === "none" ? "" : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Left Column - Content */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conteúdo</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o conteúdo da sua anotação aqui..."
                className="min-h-[300px] resize-none"
              />
            </CardContent>
          </Card>

          {/* AI Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ferramentas IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={generateSummary}
                disabled={isGeneratingSummary || !content.trim()}
                variant="outline"
                className="w-full"
              >
                {isGeneratingSummary ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Gerar Resumo
              </Button>

              <Button
                onClick={generateAudio}
                disabled={isGeneratingAudio || (!content.trim() && !summary.trim())}
                variant="outline"
                className="w-full"
              >
                {isGeneratingAudio ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4 mr-2" />
                )}
                Gerar Áudio
              </Button>

              <Button
                onClick={generateFlashcards}
                disabled={isGeneratingFlashcards || (!content.trim() && !summary.trim()) || note.id === 'new'}
                variant="outline"
                className="w-full"
              >
                {isGeneratingFlashcards ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Gerar Flashcards
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary, Audio, Flashcards */}
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              {summary ? (
                <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Clique em "Gerar Resumo" para criar um resumo automaticamente
                </p>
              )}
            </CardContent>
          </Card>

          {/* Audio Player */}
          {audioUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Áudio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleAudio}
                    variant="outline"
                    size="sm"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={resetAudio}
                    variant="ghost"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flashcards Preview */}
          {flashcards.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Flashcards</CardTitle>
                  <Badge variant="secondary">{flashcards.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {flashcards.slice(0, 3).map((flashcard, index) => (
                    <div key={flashcard.id} className="p-2 border border-border rounded text-xs">
                      <p className="font-medium mb-1">Q: {flashcard.question}</p>
                      <p className="text-muted-foreground">A: {flashcard.answer}</p>
                    </div>
                  ))}
                  {flashcards.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{flashcards.length - 3} flashcards adicionais
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};