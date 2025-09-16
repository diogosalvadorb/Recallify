import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FolderPlus, 
  FileText, 
  Calendar,
  Trash2,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  notes: any[];
  categories: any[];
  flashcards: any[];
  selectedNote: any;
  selectedCategory: string | null;
  currentView: 'notes' | 'flashcards';
  onSelectNote: (note: any) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onNotesChange: () => void;
  onCategoriesChange: () => void;
  onFlashcardsChange: () => void;
}

export const Sidebar = ({
  notes,
  categories,
  flashcards,
  selectedNote,
  selectedCategory,
  currentView,
  onSelectNote,
  onSelectCategory,
  onNotesChange,
  onCategoriesChange,
  onFlashcardsChange,
}: SidebarProps) => {
  const { toast } = useToast();
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#3B82F6");

  const createCategory = async () => {
    try {
      await apiClient.createCategory({
        name: categoryName,
        color: categoryColor,
      });

      toast({
        title: "Sucesso!",
        description: "Categoria criada com sucesso.",
      });

      setCategoryName("");
      setCategoryColor("#3B82F6");
      setShowCategoryDialog(false);
      onCategoriesChange();
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar a categoria",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.deleteNote(noteId);

      toast({
        title: "Sucesso!",
        description: "Anotação excluída com sucesso.",
      });

      if (selectedNote?.id === noteId) {
        onSelectNote(null);
      }
      onNotesChange();
      onFlashcardsChange();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir a anotação",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  if (currentView === 'flashcards') {
    // Group flashcards by note
    const flashcardsByNote = flashcards.reduce((acc, flashcard) => {
      const note = notes.find(n => n.id === flashcard.note_id);
      if (note) {
        if (!acc[note.id]) {
          acc[note.id] = { note, flashcards: [] };
        }
        acc[note.id].flashcards.push(flashcard);
      }
      return acc;
    }, {} as Record<string, { note: any, flashcards: any[] }>);

    return (
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {Object.values(flashcardsByNote).map(({ note, flashcards }) => (
            <div
              key={note.id}
              className="p-3 border border-border rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => onSelectNote(note)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm truncate">{note.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {flashcards.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(note.updated_at)}
              </div>
            </div>
          ))}
          
          {Object.keys(flashcardsByNote).length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum flashcard encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Categories */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm">Categorias</h3>
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <FolderPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Nome</Label>
                  <Input
                    id="category-name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Nome da categoria"
                  />
                </div>
                <div>
                  <Label htmlFor="category-color">Cor</Label>
                  <Input
                    id="category-color"
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                  />
                </div>
                <Button onClick={createCategory} disabled={!categoryName.trim()}>
                  Criar Categoria
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSelectCategory(null)}
            className="w-full justify-start text-xs"
          >
            Todas as anotações
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSelectCategory(category.id)}
              className="w-full justify-start text-xs"
            >
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {notes.map((note) => {
            const category = categories.find(c => c.id === note.category_id);
            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={cn(
                  "p-3 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors",
                  selectedNote?.id === note.id && "bg-accent border-primary"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm truncate pr-2">{note.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteNote(note.id, e)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {note.content || "Sem conteúdo"}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {category && (
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {category.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(note.updated_at)}
                  </div>
                </div>
              </div>
            );
          })}
          
          {notes.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma anotação encontrada</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};