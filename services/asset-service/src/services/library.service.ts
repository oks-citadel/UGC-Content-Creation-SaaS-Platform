import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error-handler';

export interface Folder {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryAsset {
  id: string;
  brandId: string;
  folderId?: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  campaignId?: string;
  campaignName?: string;
  creatorId?: string;
  creatorName?: string;
  status: 'pending' | 'approved' | 'archived';
  metadata: Record<string, string>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListAssetsQuery {
  folderId?: string;
  contentType: 'image' | 'video' | 'audio' | 'document' | 'all';
  campaignId?: string;
  page: number;
  limit: number;
  sort: 'createdAt' | 'name' | 'size';
  order: 'asc' | 'desc';
}

export interface ListAssetsResult {
  assets: LibraryAsset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateFolderParams {
  name: string;
  parentId?: string;
  description?: string;
}

export class LibraryService {
  private folders: Map<string, Folder> = new Map();
  private assets: Map<string, LibraryAsset> = new Map();

  async listAssets(brandId: string, query: ListAssetsQuery): Promise<ListAssetsResult> {
    let assets = Array.from(this.assets.values())
      .filter(a => a.brandId === brandId);

    // Apply filters
    if (query.folderId) {
      assets = assets.filter(a => a.folderId === query.folderId);
    }

    if (query.contentType !== 'all') {
      const contentTypePrefix = query.contentType + '/';
      assets = assets.filter(a => a.contentType.startsWith(contentTypePrefix));
    }

    if (query.campaignId) {
      assets = assets.filter(a => a.campaignId === query.campaignId);
    }

    // Sort
    assets.sort((a, b) => {
      const aVal = a[query.sort];
      const bVal = b[query.sort];
      const compare = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return query.order === 'asc' ? compare : -compare;
    });

    // Paginate
    const total = assets.length;
    const totalPages = Math.ceil(total / query.limit);
    const start = (query.page - 1) * query.limit;
    const paginatedAssets = assets.slice(start, start + query.limit);

    return {
      assets: paginatedAssets,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async listFolders(brandId: string, parentId?: string): Promise<Folder[]> {
    return Array.from(this.folders.values())
      .filter(f => f.brandId === brandId && f.parentId === parentId);
  }

  async createFolder(brandId: string, params: CreateFolderParams): Promise<Folder> {
    // Check for duplicate name in same parent
    const existing = Array.from(this.folders.values())
      .find(f => f.brandId === brandId && f.parentId === params.parentId && f.name === params.name);

    if (existing) {
      throw new AppError('Folder with this name already exists', 400, 'DUPLICATE_FOLDER');
    }

    // Build path
    let path = `/${params.name}`;
    if (params.parentId) {
      const parent = this.folders.get(params.parentId);
      if (!parent) {
        throw new AppError('Parent folder not found', 404, 'PARENT_NOT_FOUND');
      }
      path = `${parent.path}/${params.name}`;
    }

    const folder: Folder = {
      id: uuidv4(),
      brandId,
      name: params.name,
      description: params.description,
      parentId: params.parentId,
      path,
      assetCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.folders.set(folder.id, folder);
    logger.info({ folderId: folder.id, brandId }, 'Folder created');

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder> {
    const folder = this.folders.get(folderId);

    if (!folder) {
      throw new AppError('Folder not found', 404, 'FOLDER_NOT_FOUND');
    }

    return folder;
  }

  async updateFolder(folderId: string, updates: Partial<CreateFolderParams>): Promise<Folder> {
    const folder = this.folders.get(folderId);

    if (!folder) {
      throw new AppError('Folder not found', 404, 'FOLDER_NOT_FOUND');
    }

    if (updates.name) {
      folder.name = updates.name;
      // Update path
      const parentPath = folder.parentId
        ? this.folders.get(folder.parentId)?.path || ''
        : '';
      folder.path = `${parentPath}/${updates.name}`;
    }

    if (updates.description !== undefined) {
      folder.description = updates.description;
    }

    folder.updatedAt = new Date().toISOString();
    this.folders.set(folderId, folder);

    logger.info({ folderId }, 'Folder updated');
    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const folder = this.folders.get(folderId);

    if (!folder) {
      throw new AppError('Folder not found', 404, 'FOLDER_NOT_FOUND');
    }

    // Check for sub-folders
    const hasSubFolders = Array.from(this.folders.values())
      .some(f => f.parentId === folderId);

    if (hasSubFolders) {
      throw new AppError('Cannot delete folder with sub-folders', 400, 'HAS_SUBFOLDERS');
    }

    // Check for assets
    const hasAssets = Array.from(this.assets.values())
      .some(a => a.folderId === folderId);

    if (hasAssets) {
      throw new AppError('Cannot delete folder with assets', 400, 'HAS_ASSETS');
    }

    this.folders.delete(folderId);
    logger.info({ folderId }, 'Folder deleted');
  }

  async moveAsset(assetId: string, folderId?: string): Promise<void> {
    const asset = this.assets.get(assetId);

    if (!asset) {
      throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
    }

    if (folderId) {
      const folder = this.folders.get(folderId);
      if (!folder) {
        throw new AppError('Destination folder not found', 404, 'FOLDER_NOT_FOUND');
      }

      // Update folder asset counts
      if (asset.folderId) {
        const oldFolder = this.folders.get(asset.folderId);
        if (oldFolder) {
          oldFolder.assetCount--;
          this.folders.set(oldFolder.id, oldFolder);
        }
      }

      folder.assetCount++;
      this.folders.set(folder.id, folder);
    }

    asset.folderId = folderId;
    asset.updatedAt = new Date().toISOString();
    this.assets.set(assetId, asset);

    logger.info({ assetId, folderId }, 'Asset moved');
  }

  async addAssetToLibrary(asset: Omit<LibraryAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<LibraryAsset> {
    const libraryAsset: LibraryAsset = {
      ...asset,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.assets.set(libraryAsset.id, libraryAsset);

    // Update folder count
    if (asset.folderId) {
      const folder = this.folders.get(asset.folderId);
      if (folder) {
        folder.assetCount++;
        this.folders.set(folder.id, folder);
      }
    }

    return libraryAsset;
  }
}
