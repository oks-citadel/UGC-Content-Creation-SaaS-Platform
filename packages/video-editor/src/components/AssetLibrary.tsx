import React, { useState, useRef } from 'react';
import type { Asset } from '../types';

interface AssetLibraryProps {
  assets: Asset[];
  onAssetAdd?: (file: File) => void;
  onAssetSelect?: (asset: Asset) => void;
  onAssetDelete?: (assetId: string) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  assets,
  onAssetAdd,
  onAssetSelect,
  onAssetDelete,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      onAssetAdd?.(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    onAssetSelect?.(asset);
  };

  const handleDeleteClick = (e: React.MouseEvent, assetId: string) => {
    e.stopPropagation();
    onAssetDelete?.(assetId);
  };

  const filteredAssets = assets.filter(
    (asset) => filter === 'all' || asset.type === filter
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="asset-library">
      <div className="asset-library-header">
        <h3>Media Library</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="asset-add-button"
        >
          + Add Media
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className="asset-library-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'video' ? 'active' : ''}
          onClick={() => setFilter('video')}
        >
          Videos
        </button>
        <button
          className={filter === 'audio' ? 'active' : ''}
          onClick={() => setFilter('audio')}
        >
          Audio
        </button>
        <button
          className={filter === 'image' ? 'active' : ''}
          onClick={() => setFilter('image')}
        >
          Images
        </button>
      </div>

      <div className="asset-library-grid">
        {filteredAssets.length === 0 ? (
          <div className="asset-library-empty">
            <p>No assets found</p>
            <p className="asset-library-empty-hint">
              Click "Add Media" to upload files
            </p>
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={`asset-item ${selectedAssetId === asset.id ? 'selected' : ''}`}
              onClick={() => handleAssetClick(asset)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(asset));
              }}
            >
              <div className="asset-thumbnail">
                {asset.thumbnail ? (
                  <img src={asset.thumbnail} alt={asset.file.name} />
                ) : (
                  <div className="asset-thumbnail-placeholder">
                    {asset.type === 'video' && '🎥'}
                    {asset.type === 'audio' && '🎵'}
                    {asset.type === 'image' && '🖼️'}
                  </div>
                )}
              </div>
              <div className="asset-info">
                <div className="asset-name" title={asset.file.name}>
                  {asset.file.name}
                </div>
                <div className="asset-meta">
                  <span>{formatFileSize(asset.file.size)}</span>
                  {asset.duration && <span>{formatDuration(asset.duration)}</span>}
                </div>
              </div>
              <button
                className="asset-delete"
                onClick={(e) => handleDeleteClick(e, asset.id)}
                title="Delete asset"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
