import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '../queryClient';
import { Document } from '@shared/schema';

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  viewMode: 'grid' | 'list';
  error: string | null;
}

const initialState: DocumentState = {
  documents: [],
  selectedDocument: null,
  status: 'idle',
  viewMode: 'grid',
  error: null,
};

export const fetchDocuments = createAsyncThunk(
  'document/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiRequest('GET', '/api/documents');
      const data = await res.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchDocument = createAsyncThunk(
  'document/fetchDocument',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await apiRequest('GET', `/api/documents/${id}`);
      const data = await res.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'document/uploadDocument',
  async (documentData: Partial<Document>, { rejectWithValue }) => {
    try {
      const res = await apiRequest('POST', '/api/documents', documentData);
      const data = await res.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateDocument = createAsyncThunk(
  'document/updateDocument',
  async ({ id, data }: { id: number; data: Partial<Document> }, { rejectWithValue }) => {
    try {
      const res = await apiRequest('PUT', `/api/documents/${id}`, data);
      const responseData = await res.json();
      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'document/deleteDocument',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiRequest('DELETE', `/api/documents/${id}`);
      return id;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const starDocument = createAsyncThunk(
  'document/starDocument',
  async ({ id, starred }: { id: number; starred: boolean }, { rejectWithValue }) => {
    try {
      const res = await apiRequest('PUT', `/api/documents/${id}/star`, { starred });
      const data = await res.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewMode = action.payload;
    },
    selectDocument: (state, action: PayloadAction<Document | null>) => {
      state.selectedDocument = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Documents
      .addCase(fetchDocuments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDocuments.fulfilled, (state, action: PayloadAction<Document[]>) => {
        state.status = 'succeeded';
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch Single Document
      .addCase(fetchDocument.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.status = 'succeeded';
        state.selectedDocument = action.payload;
      })
      .addCase(fetchDocument.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Upload Document
      .addCase(uploadDocument.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(uploadDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.status = 'succeeded';
        state.documents.unshift(action.payload);
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Update Document
      .addCase(updateDocument.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.status = 'succeeded';
        const index = state.documents.findIndex(doc => doc.id === action.payload.id);
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
        if (state.selectedDocument && state.selectedDocument.id === action.payload.id) {
          state.selectedDocument = action.payload;
        }
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Delete Document
      .addCase(deleteDocument.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteDocument.fulfilled, (state, action: PayloadAction<number>) => {
        state.status = 'succeeded';
        state.documents = state.documents.filter(doc => doc.id !== action.payload);
        if (state.selectedDocument && state.selectedDocument.id === action.payload) {
          state.selectedDocument = null;
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Star Document
      .addCase(starDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        const index = state.documents.findIndex(doc => doc.id === action.payload.id);
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
        if (state.selectedDocument && state.selectedDocument.id === action.payload.id) {
          state.selectedDocument = action.payload;
        }
      });
  },
});

export const { setViewMode, selectDocument, clearError } = documentSlice.actions;

export default documentSlice.reducer;
