import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, DocumentData } from "firebase/firestore";

// Strongly-typed Firestore converter for TS models
export function createConverter<T extends object>(fromFirestore: (data: DocumentData) => T, toFirestore?: (model: T) => DocumentData): FirestoreDataConverter<T> {
  return {
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      const data = snapshot.data(options);
      return fromFirestore({ id: snapshot.id, ...data });
    },
    toFirestore(model: T): DocumentData {
      return toFirestore ? toFirestore(model) : (model as unknown as DocumentData);
    },
  };
}

