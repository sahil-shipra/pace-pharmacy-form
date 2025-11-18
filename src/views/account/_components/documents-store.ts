import { create } from 'zustand';

// Define the shape of our store
interface DocumentsStore {
    documents: File[];
    setDocuments: (files: File[]) => void;
    removeDocument: (index: number) => void;
    resetDocuments: () => void;
}

const useDocumentsStore = create<DocumentsStore>((set) => ({
    documents: [],
    setDocuments: (files) => set({ documents: files }),
    removeDocument: (index) =>
        set((state) => ({
            documents: state.documents.filter((_, i) => i !== index),
        })),
    resetDocuments: () => set({ documents: [] }),
}));

export default useDocumentsStore;