import { Router } from 'express';
import {
  getPersons,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  assignFaceToPerson,
  getPhotoFaces,
  mergePersons,
} from '../controllers/personController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Persons CRUD
router.get('/', getPersons);
router.post('/', createPerson);
router.get('/:id', getPerson);
router.patch('/:id', updatePerson);
router.delete('/:id', deletePerson);

// Face operations
router.post('/faces/assign', assignFaceToPerson);
router.get('/photos/:photoId/faces', getPhotoFaces);
router.post('/merge', mergePersons);

export default router;
