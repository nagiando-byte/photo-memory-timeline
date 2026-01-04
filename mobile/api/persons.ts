import apiClient from './client';
import type { Person, Event, Photo } from '../types';

interface Face {
  id: string;
  photoId: string;
  personId?: string;
  faceRectX: number;
  faceRectY: number;
  faceRectWidth: number;
  faceRectHeight: number;
  person?: Person;
}

interface PersonWithDetails extends Person {
  faces?: Face[];
  photos?: Photo[];
  events?: Event[];
  photoCount?: number;
  eventCount?: number;
}

interface PersonWithFaceCount extends Person {
  faceCount: number;
}

export const personsApi = {
  /**
   * Get all persons
   */
  getPersons: async (): Promise<PersonWithFaceCount[]> => {
    const response = await apiClient.get<PersonWithFaceCount[]>('/persons');
    return response.data;
  },

  /**
   * Get person by ID
   */
  getPerson: async (id: string): Promise<PersonWithDetails> => {
    const response = await apiClient.get<PersonWithDetails>(`/persons/${id}`);
    return response.data;
  },

  /**
   * Create a new person
   */
  createPerson: async (name?: string): Promise<Person> => {
    const response = await apiClient.post<Person>('/persons', { name });
    return response.data;
  },

  /**
   * Update person
   */
  updatePerson: async (
    id: string,
    data: { name?: string; representativeFaceId?: string }
  ): Promise<Person> => {
    const response = await apiClient.patch<Person>(`/persons/${id}`, data);
    return response.data;
  },

  /**
   * Delete person
   */
  deletePerson: async (id: string): Promise<void> => {
    await apiClient.delete(`/persons/${id}`);
  },

  /**
   * Assign face to person
   */
  assignFaceToPerson: async (faceId: string, personId?: string): Promise<Face> => {
    const response = await apiClient.post<Face>('/persons/faces/assign', {
      faceId,
      personId,
    });
    return response.data;
  },

  /**
   * Get faces for a photo
   */
  getPhotoFaces: async (photoId: string): Promise<Face[]> => {
    const response = await apiClient.get<Face[]>(`/persons/photos/${photoId}/faces`);
    return response.data;
  },

  /**
   * Merge two persons
   */
  mergePersons: async (
    sourcePersonId: string,
    targetPersonId: string
  ): Promise<PersonWithFaceCount> => {
    const response = await apiClient.post<PersonWithFaceCount>('/persons/merge', {
      sourcePersonId,
      targetPersonId,
    });
    return response.data;
  },
};
