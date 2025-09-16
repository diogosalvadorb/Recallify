import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { NoteEditor } from "@/components/NoteEditor";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { Plus, BookOpen, Users, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthDialog } from "@/components/AuthDialog";
import { apiClient, type Note as ApiNote, type Category as ApiCategory, type Flashcard as ApiFlashcard } from "@/lib/api-client";

// Use API client types
type Note = ApiNote;
type Category = ApiCategory;
type Flashcard = ApiFlashcard;

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'notes' | 'flashcards'>('notes');
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadNotes();
      loadCategories();
      loadFlashcards();
    }
  }, [user, selectedCategory]);

  const loadNotes = async () => {
    try {
      const data = await apiClient.getNotes(selectedCategory || undefined);
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar as anotações",
        variant: "destructive",
      });
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiClient.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  const loadFlashcards = async () => {
    try {
      const data = await apiClient.getFlashcards();
      setFlashcards(data);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os flashcards",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setNotes([]);
    setCategories([]);
    setFlashcards([]);
    setSelectedNote(null);
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: 'new',
      title: 'Nova Anotação',
      content: '',
      categoryId: selectedCategory || undefined,
      userId: user?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedNote(newNote);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Notes+AI</h1>
          <p className="text-muted-foreground mb-6">
            Sistema inteligente de anotações com resumos automáticos, áudio e flashcards gerados por IA.
          </p>
          <Button onClick={() => setShowAuthDialog(true)} className="w-full">
            Entrar / Cadastrar
          </Button>
          
          <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Acesse sua conta</DialogTitle>
              </DialogHeader>
              <AuthDialog onClose={() => setShowAuthDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Notes+AI</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 w-8 p-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button
              variant={currentView === 'notes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('notes')}
              className="flex-1"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Notas
            </Button>
            <Button
              variant={currentView === 'flashcards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('flashcards')}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Flashcards
            </Button>
          </div>

          {currentView === 'notes' && (
            <Button onClick={createNewNote} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nova Anotação
            </Button>
          )}
        </div>

        <Sidebar
          notes={notes}
          categories={categories}
          flashcards={flashcards}
          selectedNote={selectedNote}
          selectedCategory={selectedCategory}
          currentView={currentView}
          onSelectNote={setSelectedNote}
          onSelectCategory={setSelectedCategory}
          onNotesChange={loadNotes}
          onCategoriesChange={loadCategories}
          onFlashcardsChange={loadFlashcards}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentView === 'notes' ? (
          selectedNote ? (
            <NoteEditor
              note={selectedNote}
              categories={categories}
              onSave={loadNotes}
              onClose={() => setSelectedNote(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Selecione uma anotação</h2>
                <p className="text-muted-foreground">
                  Escolha uma anotação da barra lateral ou crie uma nova.
                </p>
              </div>
            </div>
          )
        ) : (
          <FlashcardViewer
            flashcards={flashcards}
            notes={notes}
            onFlashcardsChange={loadFlashcards}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
