import { api } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Folder, 
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/alert';

const FolderScan = () => {
  const [folderData, setFolderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});

  const scanFolders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/files/folders/scan');
      if (!response.ok) throw new Error('Failed to scan folders');
      const data = await response.json();
      setFolderData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanFolders();
  }, []);

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

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
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Staging Folders</h2>
        <button
          onClick={scanFolders}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Scan
        </button>
      </div>

      <div className="space-y-4">
        {folderData && Object.entries(folderData).map(([folderName, data]) => (
          <div key={folderName} className="border rounded-lg overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
              onClick={() => toggleFolder(folderName)}
            >
              <div className="flex items-center space-x-3">
                <Folder className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{folderName}</span>
                <span className="text-sm text-gray-500">({data.type})</span>
              </div>
              
              <div className="flex items-center space-x-4">
                {data.error ? (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                ) : data.validation.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                
                {expandedFolders[folderName] ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </div>

            {expandedFolders[folderName] && !data.error && (
              <div className="p-4 border-t">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Files</p>
                    <p className="text-lg font-medium">{data.validation.files_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Size</p>
                    <p className="text-lg font-medium">{data.validation.total_size_gb} GB</p>
                  </div>
                </div>

                {!data.validation.valid && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-red-500 mb-2">Issues Found:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {data.validation.issues.map((issue, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>
                            {issue.file.split('/').pop()}: {issue.issue}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-4">
                  Last scanned: {new Date(data.last_scan).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderScan;