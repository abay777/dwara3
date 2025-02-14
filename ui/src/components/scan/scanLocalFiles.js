export const scanLocalFiles = async (selectedMediaType) => {
  try {
    console.log('Scanning files with media type:', selectedMediaType);

    if (!window.showDirectoryPicker) {
      throw new Error("Your browser does not support directory selection.");
    }

    const dirHandle = await window.showDirectoryPicker();
    const mediaExtensions = {
      audio: ['.mp3', '.wav', '.flac'],
      video: ['.mp4', '.avi', '.mkv'],
      transcription_doc: ['.txt', '.docx', '.pdf'],
      picture: ['.jpg', '.png', '.gif']
    };

    const determineFileType = (fileName) => {
      const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
      for (const [type, extensions] of Object.entries(mediaExtensions)) {
        if (extensions.includes(ext)) return type;
      }
      return null;
    };

    const traverseDirectory = async (dirHandle, parentPath = '') => {
      let folderFiles = [];
      let folderSubfolders = {}; // Always ensure this is an object
      let hasValidFile = false;

      for await (const entry of dirHandle.values()) {
        const entryPath = `${parentPath}/${entry.name}`;

        if (entry.kind === 'directory') {
          const subfolderData = await traverseDirectory(entry, entryPath);

          // Ensure subfolders are always included **if they contain valid files**
          if (subfolderData && (Object.keys(subfolderData.files || {}).length > 0 || Object.keys(subfolderData.subfolders || {}).length > 0)) {
            folderSubfolders[entry.name] = subfolderData;
            hasValidFile = true;
          }
        } else if (entry.kind === 'file') {
          const fileType = determineFileType(entry.name);

          if (fileType && (selectedMediaType === 'all' || selectedMediaType === fileType)) {
            try {
              const file = await entry.getFile();
              const fileSizeGB = file.size / (1024 * 1024 * 1024);

              folderFiles.push({
                name: entry.name,
                path: entryPath,
                size_gb: fileSizeGB.toFixed(3),
                type: fileType
              });

              hasValidFile = true;
            } catch (fileError) {
              console.warn(`Skipping file ${entry.name} due to read error:`, fileError);
            }
          }
        }
      }

      // Ensure folderSubfolders is always an object
      folderSubfolders = folderSubfolders || {};

      // Keep subfolders even if this folder has no valid files, as long as any subfolder does
      if (hasValidFile || Object.keys(folderSubfolders).length > 0) {
        return {
          type: 'folder',
          path: parentPath || dirHandle.name,
          validation: {
            valid: false,
            files_count: folderFiles.length,
            total_size_gb: folderFiles.reduce((sum, file) => sum + parseFloat(file.size_gb), 0),
            issues: []
          },
          files: folderFiles,
          subfolders: folderSubfolders
        };
      }

      return {}; // Ignore completely empty folders
    };

    const scannedData = await traverseDirectory(dirHandle);
    if (!scannedData || Object.keys(scannedData).length === 0) {
      console.warn('No valid files found, returning empty data.');
      return {};
    }

    const requestPayload = { [scannedData.path]: scannedData };

    const response = await fetch('http://localhost:8000/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Validation API Error (${response.status}): ${errorDetails}`);
    }

    const validationResults = await response.json();
    Object.keys(validationResults).forEach(folderName => {
      if (scannedData.path === validationResults[folderName].path) {
        scannedData.validation = validationResults[folderName].validation;
      }
    });

    console.log('Final Scanned Data:', scannedData);
    return scannedData;
  } catch (error) {
    console.error('Error accessing local files:', error);
    throw new Error(error.message || 'Failed to scan local storage');
  }
};
