import { Request, Response } from 'express';
import { CategoryConflictError, CategoryNotFoundError, CategoryUseCase } from '../../../application/categoryUseCase';
import { SupabaseCategoryRepository } from '../../../infrastructure/supabaseCategoryRepository';

const repository = new SupabaseCategoryRepository();
const useCase = new CategoryUseCase(repository);

const sendError = (res: Response, statusCode: number, error: string): void => {
  res.status(statusCode).json({ error, statusCode });
};

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await useCase.getAllCategories();
    res.status(200).json({ data: categories });
  } catch (error) {
    console.error('[categoryController] getAllCategories error:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string') {
      sendError(res, 400, 'El nombre de la categoría es requerido');
      return;
    }

    const category = await useCase.createCategory(name, description);
    res.status(201).json({ data: category });
  } catch (error) {
    if (error instanceof CategoryConflictError) {
      sendError(res, 409, error.message);
      return;
    }
    console.error('[categoryController] createCategory error:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await useCase.updateCategory(id, name, description);
    res.status(200).json({ data: category });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      sendError(res, 404, error.message);
      return;
    }
    if (error instanceof CategoryConflictError) {
      sendError(res, 409, error.message);
      return;
    }
    console.error('[categoryController] updateCategory error:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await useCase.deleteCategory(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      sendError(res, 404, error.message);
      return;
    }
    if (error instanceof CategoryConflictError) {
      sendError(res, 409, error.message);
      return;
    }
    console.error('[categoryController] deleteCategory error:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
};
