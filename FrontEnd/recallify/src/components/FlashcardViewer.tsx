import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient, GenerateFlashcardAudioRequest } from "@/lib/api-client";
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Shuffle,
  BookOpen,
  Volume2,
  VolumeX,
  Loader2,
  Play,
  Pause
} from "lucide-react";

interface FlashcardViewerProps {
  flashcards: any[];
  notes: any[];
  onFlashcardsChange: () => void;
}

export const FlashcardViewer = ({ flashcards, notes, onFlashcardsChange }: FlashcardViewerProps) => {
  const { toast } = useToast();
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  
  const [filteredFlashcards, setFilteredFlashcards] = useState(flashcards);
  
  // Audio state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [questionAudio, setQuestionAudio] = useState<HTMLAudioElement | null>(null);
  const [answerAudio, setAnswerAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [isPlayingAnswer, setIsPlayingAnswer] = useState(false);
  const [audioUrls, setAudioUrls] = useState<{[key: string]: {question?: string, answer?: string}}>({});

  useEffect(() => {
    if (selectedNoteId) {
      const noteFlashcards = flashcards.filter(fc => fc.note_id === selectedNoteId);
      setFilteredFlashcards(noteFlashcards);
    } else {
      setFilteredFlashcards(flashcards);
    }
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [selectedNoteId, flashcards]);

  const currentFlashcard = filteredFlashcards[currentIndex];
  const currentNote = currentFlashcard ? notes.find(n => n.id === currentFlashcard.note_id) : null;

  const nextCard = () => {
    if (currentIndex < filteredFlashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...filteredFlashcards].sort(() => Math.random() - 0.5);
    setFilteredFlashcards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
    setIsShuffled(true);
    
    toast({
      title: "Cartas embaralhadas!",
      description: "A ordem dos flashcards foi randomizada.",
    });
  };

  const resetOrder = () => {
    if (selectedNoteId) {
      const noteFlashcards = flashcards.filter(fc => fc.note_id === selectedNoteId);
      setFilteredFlashcards(noteFlashcards);
    } else {
      setFilteredFlashcards(flashcards);
    }
    setCurrentIndex(0);
    setShowAnswer(false);
    setIsShuffled(false);
  };

  const generateFlashcardAudio = async (type: "question" | "answer" | "both") => {
    if (!currentFlashcard) return;
    
    setIsGeneratingAudio(true);
    try {
      const request: GenerateFlashcardAudioRequest = {
        voice: "burt",
        type: type
      };

      const response = await apiClient.generateFlashcardAudio(currentFlashcard.id, request);
      
      const urls = { ...audioUrls };
      if (!urls[currentFlashcard.id]) {
        urls[currentFlashcard.id] = {};
      }

      if (response.questionAudioContent) {
        const binaryString = atob(response.questionAudioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        urls[currentFlashcard.id].question = url;
      }

      if (response.answerAudioContent) {
        const binaryString = atob(response.answerAudioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        urls[currentFlashcard.id].answer = url;
      }

      setAudioUrls(urls);
      
      toast({
        title: "Sucesso!",
        description: "Áudio gerado com sucesso.",
      });
    } catch (error) {
      console.error('Error generating flashcard audio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o áudio",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const playAudio = (type: "question" | "answer") => {
    if (!currentFlashcard) return;
    
    const audioUrl = audioUrls[currentFlashcard.id]?.[type];
    if (!audioUrl) return;

    if (type === "question") {
      if (questionAudio) {
        questionAudio.pause();
        questionAudio.currentTime = 0;
      }
      
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingQuestion(false);
      audio.onplay = () => setIsPlayingQuestion(true);
      audio.onpause = () => setIsPlayingQuestion(false);
      
      setQuestionAudio(audio);
      audio.play();
    } else {
      if (answerAudio) {
        answerAudio.pause();
        answerAudio.currentTime = 0;
      }
      
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAnswer(false);
      audio.onplay = () => setIsPlayingAnswer(true);
      audio.onpause = () => setIsPlayingAnswer(false);
      
      setAnswerAudio(audio);
      audio.play();
    }
  };

  const pauseAudio = (type: "question" | "answer") => {
    if (type === "question" && questionAudio) {
      questionAudio.pause();
    } else if (type === "answer" && answerAudio) {
      answerAudio.pause();
    }
  };

  // Cleanup audio on component unmount or flashcard change
  useEffect(() => {
    return () => {
      if (questionAudio) {
        questionAudio.pause();
        setQuestionAudio(null);
      }
      if (answerAudio) {
        answerAudio.pause();
        setAnswerAudio(null);
      }
      setIsPlayingQuestion(false);
      setIsPlayingAnswer(false);
    };
  }, [currentIndex]);

  // Cleanup audio URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(audioUrls).forEach(urls => {
        if (urls.question) URL.revokeObjectURL(urls.question);
        if (urls.answer) URL.revokeObjectURL(urls.answer);
      });
    };
  }, []);

  const generateBulkAudio = async () => {
    if (filteredFlashcards.length === 0) return;
    
    setIsGeneratingAudio(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      toast({
        title: "Gerando áudio em lote...",
        description: `Processando ${filteredFlashcards.length} flashcards`,
      });

      for (const flashcard of filteredFlashcards) {
        try {
          const request: GenerateFlashcardAudioRequest = {
            voice: "burt",
            type: "both"
          };

          const response = await apiClient.generateFlashcardAudio(flashcard.id, request);
          
          const urls = { ...audioUrls };
          if (!urls[flashcard.id]) {
            urls[flashcard.id] = {};
          }

          if (response.questionAudioContent) {
            const binaryString = atob(response.questionAudioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            urls[flashcard.id].question = url;
          }

          if (response.answerAudioContent) {
            const binaryString = atob(response.answerAudioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            urls[flashcard.id].answer = url;
          }

          setAudioUrls(urls);
          successCount++;
        } catch (error) {
          console.error(`Error generating audio for flashcard ${flashcard.id}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Geração de áudio concluída!",
        description: `${successCount} flashcards processados com sucesso${errorCount > 0 ? `, ${errorCount} com erro` : ''}`,
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum flashcard encontrado</h2>
          <p className="text-muted-foreground">
            Crie anotações e gere flashcards usando as ferramentas de IA para começar a estudar.
          </p>
        </div>
      </div>
    );
  }

  if (filteredFlashcards.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-4">
            <Select value={selectedNoteId || "all"} onValueChange={(value) => setSelectedNoteId(value === "all" ? "" : value)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por anotação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as anotações</SelectItem>
                {notes
                  .filter(note => flashcards.some(fc => fc.note_id === note.id))
                  .map((note) => (
                    <SelectItem key={note.id} value={note.id}>
                      {note.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum flashcard nesta anotação</h2>
            <p className="text-muted-foreground">
              Selecione uma anotação diferente ou gere flashcards para esta anotação.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={selectedNoteId || "all"} onValueChange={(value) => setSelectedNoteId(value === "all" ? "" : value)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por anotação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as anotações</SelectItem>
                {notes
                  .filter(note => flashcards.some(fc => fc.note_id === note.id))
                  .map((note) => (
                    <SelectItem key={note.id} value={note.id}>
                      {note.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Badge variant="secondary">
              {currentIndex + 1} de {filteredFlashcards.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={generateBulkAudio}
              variant="outline"
              size="sm"
              disabled={isGeneratingAudio || filteredFlashcards.length === 0}
            >
              {isGeneratingAudio ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4 mr-2" />
              )}
              Gerar Áudio p/ Todos
            </Button>
            
            <Button
              onClick={shuffleCards}
              variant="outline"
              size="sm"
              disabled={filteredFlashcards.length < 2}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Embaralhar
            </Button>
            
            {isShuffled && (
              <Button
                onClick={resetOrder}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Ordem Original
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <Card className="min-h-[400px] cursor-pointer" onClick={() => setShowAnswer(!showAnswer)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">
                  {showAnswer ? "Resposta" : "Pergunta"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {currentNote && (
                    <Badge variant="outline" className="text-xs">
                      {currentNote.title}
                    </Badge>
                  )}
                  
                  {/* Audio generation button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      generateFlashcardAudio(showAnswer ? "answer" : "question");
                    }}
                    disabled={isGeneratingAudio}
                  >
                    {isGeneratingAudio ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAnswer(!showAnswer);
                    }}
                  >
                    {showAnswer ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <p className="text-lg leading-relaxed">
                  {showAnswer ? currentFlashcard.answer : currentFlashcard.question}
                </p>
                
                {/* Audio playback controls */}
                {currentFlashcard && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {audioUrls[currentFlashcard.id]?.[showAnswer ? "answer" : "question"] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const isPlaying = showAnswer ? isPlayingAnswer : isPlayingQuestion;
                          if (isPlaying) {
                            pauseAudio(showAnswer ? "answer" : "question");
                          } else {
                            playAudio(showAnswer ? "answer" : "question");
                          }
                        }}
                      >
                        {(showAnswer ? isPlayingAnswer : isPlayingQuestion) ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {!audioUrls[currentFlashcard.id]?.[showAnswer ? "answer" : "question"] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateFlashcardAudio(showAnswer ? "answer" : "question");
                        }}
                        disabled={isGeneratingAudio}
                      >
                        {isGeneratingAudio ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
                
                {!showAnswer && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Clique para revelar a resposta
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              onClick={prevCard}
              disabled={currentIndex === 0}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="text-sm text-muted-foreground">
              Use as setas ou clique no card para navegar
            </div>

            <Button
              onClick={nextCard}
              disabled={currentIndex === filteredFlashcards.length - 1}
              variant="outline"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};