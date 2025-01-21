import React, { useState } from 'react';
import { RefreshCw, FolderInput, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/alert';

// Sample NAS configuration
const NAS_CONFIG = {
  nas1: {
    name: 'Production NAS',
    scanDirs: [
      { path: '/mnt/nas1/ingest/films', type: 'film' },
      { path: '/mnt/nas1/ingest/series', type: 'series' },
      { path: '/mnt/nas1/ingest/shorts', type: 'short' }
    ]
  },
  nas2: {
    name: 'Backup NAS',
    scanDirs: [
      { path: '/mnt/nas2/ingest/documentaries', type: 'documentary' },
      { path: '/mnt/nas2/ingest/raw', type: 'raw_footage' }
    ]
  }
};

// Sample data structure matching our existing format
const SAMPLE_FOLDER_DATA = {
  'Film Projects 2024': {
    type: 'film',
    nasLocation: 'nas1',
    path: '/mnt/nas1/ingest/films/projects_2024',
    validation: {
      valid: true,
      files_count: 156,
      total_size_gb: 245.7,
      issues: []
    }
  },
  'Documentary Series': {
    type: 'series',
    nasLocation: 'nas1',
    path: '/mnt/nas1/ingest/series/documentary_series',
    validation: {
      valid: false,
      files_count: 89,
      total_size_gb: 178.3,
      issues: [
        {
          file: '/mnt/storage/docs/ep03/missing_subtitles.srt',
          issue: 'Missing subtitle files'
        },
        {
          file: '/mnt/storage/docs/ep05/metadata.json',
          issue: 'Invalid metadata format'
        }
      ]
    }
  },
  'Raw Footage Archive': {
    type: 'raw_footage',
    nasLocation: 'nas2',
    path: '/mnt/nas2/ingest/raw/footage_archive',
    validation: {
      valid: true,
      files_count: 432,
      total_size_gb: 1256.8,
      issues: []
    }
  },
  'Short Films Collection': {
    type: 'short',
    nasLocation: 'nas1',
    path: '/mnt/nas1/ingest/shorts/collection',
    error: 'Failed to access directory',
  },
  'Documentary Projects': {
    type: 'documentary',
    nasLocation: 'nas2',
    path: '/mnt/nas2/ingest/documentaries/projects',
    validation: {
      valid: false,
      files_count: 67,
      total_size_gb: 89.4,
      issues: [
        {
          file: '/mnt/storage/anim/project2/render_files',
          issue: 'Incomplete render sequence'
        }
      ]
    }
  }
};

const FolderScan = () => {
  const [folderData, setFolderData] = useState(SAMPLE_FOLDER_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [selectedNas, setSelectedNas] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Generate available content types from NAS config
  const contentTypes = ['all', ...new Set(
    Object.values(NAS_CONFIG).flatMap(nas => 
      nas.scanDirs.map(dir => dir.type)
    )
  )];

  const scanFolders = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const toggleSelectFolder = (folderName) => {
    setSelectedFolders(prev => 
      prev.includes(folderName)
        ? prev.filter(name => name !== folderName)
        : [...prev, folderName]
    );
  };

  const toggleSelectAll = () => {
    const filteredFolders = Object.entries(folderData)
      .filter(([_, data]) => {
        const matchesNas = selectedNas === 'all' || data.nasLocation === selectedNas;
        const matchesType = selectedType === 'all' || data.type === selectedType;
        return matchesNas && matchesType;
      })
      .map(([name]) => name);

    if (selectedFolders.length === filteredFolders.length) {
      setSelectedFolders([]);
    } else {
      setSelectedFolders(filteredFolders);
    }
  };

  const handleIngest = async () => {
    if (selectedFolders.length === 0) return;
    setIsIngesting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSelectedFolders([]);
    setIsIngesting(false);
  };

  // Filter folders based on selected NAS and content type
  const filteredFolders = Object.entries(folderData)
    .filter(([_, data]) => {
      const matchesNas = selectedNas === 'all' || data.nasLocation === selectedNas;
      const matchesType = selectedType === 'all' || data.type === selectedType;
      return matchesNas && matchesType;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Error scanning folders</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-gradient-to-b from-blue-50/50 to-white rounded-lg shadow-sm border border-blue-100">
      {/* Header Section */}
      <div className="p-6 flex items-center justify-between border-b border-blue-100">
        <h1 className="text-2xl font-semibold text-gray-900">Staging Folders</h1>
        
        <div className="flex items-center gap-4">
          <Select value={selectedNas} onChange={setSelectedNas}>
            <SelectTrigger className="w-48 bg-white border-blue-100 hover:border-blue-200 transition-colors">
              <SelectValue placeholder="All NAS Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All NAS Locations</SelectItem>
              {Object.entries(NAS_CONFIG).map(([id, nas]) => (
                <SelectItem key={id} value={id}>{nas.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onChange={setSelectedType}>
            <SelectTrigger className="w-40 bg-white border-blue-100 hover:border-blue-200 transition-colors">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {contentTypes
                .filter(t => t !== 'all')
                .map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={scanFolders}
            className="bg-white hover:bg-blue-50 border-blue-100 hover:border-blue-200 text-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Scan
          </Button>

          <Button 
            onClick={handleIngest}
            disabled={selectedFolders.length === 0 || isIngesting}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {isIngesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FolderInput className="h-4 w-4 mr-2" />
            )}
            Ingest Selected
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-50/50">
              <th className="w-12 pl-6 pr-4 py-4">
                <Checkbox 
                  checked={selectedFolders.length === filteredFolders.length && filteredFolders.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wider">
                Folder Name
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wider">
                Files
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wider">
                Size
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100">
            {filteredFolders.map(([folderName, data]) => (
              <tr 
                key={folderName}
                className="hover:bg-blue-50/30 transition-colors"
              >
                <td className="pl-6 pr-4 py-4 whitespace-nowrap">
                  <Checkbox 
                    checked={selectedFolders.includes(folderName)}
                    onChange={() => toggleSelectFolder(folderName)}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center group relative">
                    <FolderInput className="h-4 w-4 text-blue-300 mr-3" />
                    <span className="font-medium text-gray-900">{folderName}</span>
                    {/* Tooltip */}
                    <div className="invisible group-hover:visible absolute left-0 -bottom-1 transform translate-y-full bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {data.path}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-600">
                  {NAS_CONFIG[data.nasLocation].name}
                </td>
                <td className="px-4 py-4 text-gray-600">
                  {data.type.charAt(0).toUpperCase() + data.type.slice(1).replace('_', ' ')}
                </td>
                <td className="px-4 py-4 text-gray-900">
                  {data.validation?.files_count || '-'}
                </td>
                <td className="px-4 py-4 text-gray-900">
                  {data.validation?.total_size_gb ? `${data.validation.total_size_gb} GB` : '-'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                      data.error 
                        ? 'bg-yellow-500'
                        : data.validation?.valid
                          ? 'bg-green-500'
                          : 'bg-red-500'
                    }`} />
                    <span className="text-gray-600">
                      {data.error 
                        ? 'Error'
                        : data.validation?.valid
                          ? 'Valid'
                          : 'Invalid'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FolderScan;