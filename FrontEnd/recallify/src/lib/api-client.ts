import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = "https://localhost:7223/api";

export interface Category {
  id: string;
  name: string;
  color?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  audioUrl?: string;
  categoryId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  noteId: string;
  question: string;
  answer: string;
  questionAudioUrl?: string;
  answerAudioUrl?: string;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  summary?: string;
  audioUrl?: string;
  categoryId?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  summary?: string;
  audioUrl?: string;
  categoryId?: string;
}

export interface CreateFlashcardRequest {
  question: string;
  answer: string;
}

export interface CreateFlashcardsRequest {
  flashcards: CreateFlashcardRequest[];
}

// AI Service interfaces
export interface GenerateSummaryRequest {
 content: string;
}


export interface GenerateSummaryResponse {
 summary: string;
}


export interface GenerateFlashcardsRequest {
 content: string;
}


export interface FlashcardData {
 question: string;
 answer: string;
}


export interface GenerateFlashcardsResponse {
 flashcards: FlashcardData[];
}


export interface GenerateAudioRequest {
 text: string;
 voice?: string;
}


export interface GenerateAudioResponse {
 audioContent: string; // Base64 encoded audio
}

export interface GenerateFlashcardAudioRequest {
  voice?: string;
  type?: string; // "question", "answer", or "both"
}

export interface GenerateFlashcardAudioResponse {
  questionAudioContent?: string; // Base64 encoded audio for question
  answerAudioContent?: string; // Base64 encoded audio for answer
}

class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('Access forbidden. You do not have permission to perform this action.');
      }
      if (response.status === 404) {
        throw new Error('Resource not found.');
      }
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.text();
        if (errorData) {
          errorMessage = errorData;
        }
      } catch {
        // Ignore error parsing errors
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  // AI API
  async generateSummary(request: GenerateSummaryRequest): Promise<GenerateSummaryResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/ai/generate-summary`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    
    return this.handleResponse<GenerateSummaryResponse>(response);
  }
  
  async generateFlashcards(request: GenerateFlashcardsRequest): Promise<GenerateFlashcardsResponse> {
  const headers = await this.getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/ai/generate-flashcards`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });
   return this.handleResponse<GenerateFlashcardsResponse>(response);
}

async generateAudio(request: GenerateAudioRequest): Promise<GenerateAudioResponse> {
  const headers = await this.getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/ai/generate-audio`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });
   return this.handleResponse<GenerateAudioResponse>(response);
}


  async generateNoteSummary(noteId: string): Promise<GenerateSummaryResponse> {
  const headers = await this.getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}/generate-summary`, {
    method: 'POST',
    headers
  });
   return this.handleResponse<GenerateSummaryResponse>(response);
}

async generateNoteAudio(noteId: string, voice: string = 'burt'): Promise<GenerateAudioResponse> {
  const headers = await this.getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}/generate-audio`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: "", voice }) // Backend gets text from note, so we send empty text
  });
   return this.handleResponse<GenerateAudioResponse>(response);
}

async generateNoteFlashcards(noteId: string): Promise<Flashcard[]> {
  const headers = await this.getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}/flashcards/generate`, {
    method: 'POST',
    headers
  });
   return this.handleResponse<Flashcard[]>(response);
}

  // Categories API
  async getCategories(): Promise<Category[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers
    });
    
    return this.handleResponse<Category[]>(response);
  }

  async createCategory(request: CreateCategoryRequest): Promise<Category> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    
    return this.handleResponse<Category>(response);
  }

  async updateCategory(id: string, request: UpdateCategoryRequest): Promise<Category> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(request)
    });
    
    return this.handleResponse<Category>(response);
  }

  async deleteCategory(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers
    });
    
    await this.handleResponse<void>(response);
  }

  // Notes API
  async getNotes(categoryId?: string): Promise<Note[]> {
    const headers = await this.getAuthHeaders();
    const url = categoryId 
      ? `${API_BASE_URL}/notes?categoryId=${encodeURIComponent(categoryId)}`
      : `${API_BASE_URL}/notes`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    return this.handleResponse<Note[]>(response);
  }

  async getNote(id: string): Promise<Note> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'GET',
      headers
    });
    
    return this.handleResponse<Note>(response);
  }

  async createNote(request: CreateNoteRequest): Promise<Note> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    
    return this.handleResponse<Note>(response);
  }

  async updateNote(id: string, request: UpdateNoteRequest): Promise<Note> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(request)
    });
    
    return this.handleResponse<Note>(response);
  }

  async deleteNote(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
      headers
    });
    
    await this.handleResponse<void>(response);
  }

  // Flashcards API
  async getFlashcards(): Promise<Flashcard[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/flashcards`, {
      method: 'GET',
      headers
    });
    
    return this.handleResponse<Flashcard[]>(response);
  }

  async getFlashcardsByNoteId(noteId: string): Promise<Flashcard[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/flashcards`, {
      method: 'GET',
      headers
    });
    
    return this.handleResponse<Flashcard[]>(response);
  }

  async createFlashcards(noteId: string, request: CreateFlashcardsRequest): Promise<Flashcard[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/flashcards`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    
    return this.handleResponse<Flashcard[]>(response);
  }

  async deleteFlashcard(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
      method: 'DELETE',
      headers
    });
    
    await this.handleResponse<void>(response);
  }

  async generateFlashcardAudio(id: string, request: GenerateFlashcardAudioRequest): Promise<GenerateFlashcardAudioResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/flashcards/${id}/generate-audio`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    
    return this.handleResponse<GenerateFlashcardAudioResponse>(response);
  }
}

export const apiClient = new ApiClient();