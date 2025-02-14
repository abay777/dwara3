import React, { useState } from "react";
import { RefreshCw, ArrowBigDown, ArrowBigRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { scanLocalFiles } from "./scanLocalFiles";
import { Select, SelectItem } from "../ui/select";

// NAS Configuration
const NAS_CONFIG = {
  nas1: {
    name: "Production NAS",
    scanDirs: [
      { path: "/mnt/nas1/ingest/films", type: "film" },
      { path: "/mnt/nas1/ingest/series", type: "series" },
      { path: "/mnt/nas1/ingest/shorts", type: "short" },
    ],
  },
  nas2: {
    name: "Backup NAS",
    scanDirs: [
      { path: "/mnt/nas2/ingest/documentaries", type: "documentary" },
      { path: "/mnt/nas2/ingest/raw", type: "raw_footage" },
    ],
  },
  local: {
    name: "Local Storage",
    scanDirs: [],
  },
};

// Media Types Filter
const MEDIA_TYPES = ["all", "audio", "video", "transcription_doc", "picture"];

const FolderScan = () => {
  const [folderData, setFolderData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNas, setSelectedNas] = useState("local");
  const [selectedMediaType, setSelectedMediaType] = useState("all");
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  // Toggle Folder Expand/Collapse
  const toggleFolderExpand = (folderPath) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // Handle Scan
  const scanFolders = async () => {
    setLoading(true);
    setError(null);
    setSelectedItems({});
    setSelectAll(false);
    let data = {};

    if (selectedNas === "local") {
      try {
        data = await scanLocalFiles(selectedMediaType);
        console.log(data, "file data");
      } catch (err) {
        setError("Failed to access local storage.");
        setLoading(false);
        return;
      }
    }

    setFolderData(data);
    setLoading(false);
  };

  // Check if Ingest Button Should Be Active
  const isIngestEnabled = Object.values(selectedItems).some(
    (isSelected) => isSelected
  );

  const checkIfAllSelected = () => {
    let totalValidItems = 0;
    let selectedValidItems = 0;
  
    const traverseAndCount = (folder) => {
      if (!folder) return;
  
      // Count valid folders
      if (!folder.validation?.issues?.some(issue => issue.file === folder.path)) {
        totalValidItems += 1;
        if (selectedItems[folder.path]) selectedValidItems += 1;
      }
  
      // Count valid files
      if (folder.files) {
        folder.files.forEach((file) => {
          if (!folder.validation?.issues?.some(issue => issue.file === file.path)) {
            totalValidItems += 1;
            if (selectedItems[file.path]) selectedValidItems += 1;
          }
        });
      }
  
      // Traverse valid subfolders
      if (folder.subfolders) {
        Object.values(folder.subfolders).forEach(subfolder => traverseAndCount(subfolder));
      }
    };
  
    Object.values(folderData).forEach(folder => traverseAndCount(folder));
  
    if (totalValidItems === 0) return false; // No valid files or folders
    if (selectedValidItems === 0) return false; // Nothing selected
    return selectedValidItems === totalValidItems ? true : "indeterminate"; // All or some selected
  };
  
  console.log(checkIfAllSelected(),'value')
  
  // Function to toggle "Select All"
  const toggleSelectAll = () => {
    const shouldSelectAll = checkIfAllSelected() !== true; // If not all selected, select all
  
    let updatedSelections = {};
  
    const traverseAndSelect = (folder) => {
      if (!folder) return;
  
      // Select only valid folders
      if (!folder.validation?.issues?.some(issue => issue.file === folder.path)) {
        updatedSelections[folder.path] = shouldSelectAll;
      }
  
      // Select only valid files
      if (folder.files) {
        folder.files.forEach((file) => {
          if (!folder.validation?.issues?.some(issue => issue.file === file.path)) {
            updatedSelections[file.path] = shouldSelectAll;
          }
        });
      }
  
      // Traverse valid subfolders
      if (folder.subfolders) {
        Object.values(folder.subfolders).forEach(subfolder => traverseAndSelect(subfolder));
      }
    };
  
    Object.values(folderData).forEach(folder => traverseAndSelect(folder));
  
    setSelectedItems(updatedSelections);
  };
  
  
  // Toggle selection for individual folders & files
  const toggleSelection = (itemPath, itemType, folder) => {
    setSelectedItems((prevSelectedItems) => {
      let newSelection = { ...prevSelectedItems };
  
      if (itemType === 'folder') {
        // Folder selection selects valid subfolders & files
        const traverseAndSelect = (currentFolder) => {
          if (!currentFolder) return;
          newSelection[currentFolder.path] = !prevSelectedItems[currentFolder.path];
  
          if (currentFolder.files) {
            currentFolder.files.forEach(file => {
              if (!folder.validation?.issues?.some(issue => issue.file === file.path)) {
                newSelection[file.path] = newSelection[currentFolder.path];
              }
            });
          }
  
          if (currentFolder.subfolders) {
            Object.values(currentFolder.subfolders).forEach(subfolder => traverseAndSelect(subfolder));
          }
        };
        traverseAndSelect(folder);
      } else {
        // Select individual files if valid
        if (!folder.validation?.issues?.some(issue => issue.file === itemPath)) {
          newSelection[itemPath] = !prevSelectedItems[itemPath];
        }
      }
  
      return newSelection;
    });
  };

  // Recursive function to render folders and files with selection rules
  const renderFolderContents = (folder, level = 0) => {
    return (
      <>
        <tr key={folder.path} className="hover:bg-blue-50/30">
          <td className="pl-6 pr-4 py-4 whitespace-nowrap">
            <Checkbox
              checked={!!selectedItems[folder.path]}
              onChange={() => toggleSelection(folder.path, "folder", folder)}
            />
          </td>
          <td
            className="px-4 py-4 text-gray-900 font-medium flex items-center"
            style={{ paddingLeft: `${level * 20}px` }}
          >
            <button
              className="bg-gray-500 px-3 py-2 rounded-md"
              onClick={() => toggleFolderExpand(folder.path)}
            >
              {expandedFolders[folder.path] ? (
                <ArrowBigDown />
              ) : (
                <ArrowBigRight />
              )}
            </button>
            <span className="ml-2">{folder.path.split("/").pop()}</span>
          </td>
          <td className="px-4 py-4 text-gray-600">{folder.path}</td>
          <td className="px-4 py-4 text-gray-600">Folder</td>
          <td className="px-4 py-4 text-gray-900">
            {folder.validation?.files_count || 0}
          </td>
        </tr>

        {expandedFolders[folder.path] &&
          folder.files &&
          folder.files.length > 0 &&
          folder.files.map((file, index) => {
            const fileIssue = folder.validation?.issues?.find(
              (issue) => issue.file === file.path
            );
            const fileStatus = fileIssue ? "Invalid" : "Valid";

            return (
              <tr
                key={`${folder.path}-${file.name}-${index}`}
                className="bg-gray-50"
              >
                <td className="pl-12 py-2 whitespace-nowrap">
                  <Checkbox
                    checked={!!selectedItems[file.path]}
                    onChange={() => toggleSelection(file.path, "file", folder)}
                    disabled={!!fileIssue} // Disable invalid files
                  />
                </td>
                <td
                  className="px-4 py-2 text-gray-700"
                  style={{ paddingLeft: `${(level + 1) * 20}px` }}
                >
                  {file.name}
                </td>
                <td className="px-4 py-2 text-gray-600">{file.path}</td>
                <td className="px-4 py-2 text-gray-600">{file.type}</td>
                <td className="px-4 py-2 text-gray-700">
                  {parseFloat(file.size_gb).toFixed(2)} GB
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {fileStatus === "Valid" ? (
                    <span className="text-green-600 font-semibold">Valid</span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      Invalid ({fileIssue.issue})
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

        {expandedFolders[folder.path] &&
          folder.subfolders &&
          Object.values(folder.subfolders).map((subfolder) =>
            renderFolderContents(subfolder, level + 1)
          )}
      </>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white shadow-lg rounded-xl border border-gray-200">
      {/* Header Section */}
      <div className="p-6 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl">
        <h1 className="text-2xl font-semibold text-gray-800">
          Staging Folders
        </h1>
        <div className="flex items-center gap-4">
          <Select value={selectedNas} onChange={setSelectedNas}>
            {Object.entries(NAS_CONFIG).map(([id, nas]) => (
              <SelectItem key={id} value={id}>
                {nas.name}
              </SelectItem>
            ))}
          </Select>
          <Select value={selectedMediaType} onChange={setSelectedMediaType}>
            {MEDIA_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace("_", " ").toUpperCase()}
              </SelectItem>
            ))}
          </Select>
          <Button
            variant="outline"
            onClick={scanFolders}
            className="bg-white border-gray-300 text-gray-700 px-4"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Scan
          </Button>
          <Button variant="default" disabled={!isIngestEnabled}>
            Ingest
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-50/50">
              <th className="w-12 pl-6 pr-4 py-4">
                {/* <Checkbox
                 checked={checkIfAllSelected() === true}
                 indeterminate={checkIfAllSelected() === "indeterminate"}
                 onChange={toggleSelectAll} 
                /> */}
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium">
                Folder Name
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium">Path</th>
              <th className="px-4 py-4 text-left text-xs font-medium">Type</th>
              <th className="px-4 py-4 text-left text-xs font-medium">Files</th>
              <th className="px-4 py-4 text-left text-xs font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(folderData).length === 0 ? (
              <tr>
                <td colSpan="6">No valid files found.</td>
              </tr>
            ) : (
              renderFolderContents(folderData)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FolderScan;
