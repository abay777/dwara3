from fastapi import APIRouter
from typing import Dict, Any
import random

router = APIRouter()

def generate_mock_validation(folder_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes the input folder structure and ensures all folders and files are marked as valid,
    except for one randomly selected file, which is marked as invalid.
    """
    updated_data = {}
    all_files = []

    # First, gather all files across folders to randomly pick one
    def collect_files(folder):
        if "files" in folder and folder["files"]:
            all_files.extend(folder["files"])
        if "subfolders" in folder and folder["subfolders"]:
            for subfolder in folder["subfolders"].values():
                collect_files(subfolder)

    for folder in folder_data.values():
        collect_files(folder)

    # Randomly select one file to mark as invalid
    invalid_file = random.choice(all_files) if all_files else None

    def update_folder(folder):
        """
        Recursively updates the folder structure to mark the selected file as invalid.
        """
        updated_folder = {
            **folder,
            "validation": {
                "valid": True,  # Default to valid
                "files_count": len(folder.get("files", [])),
                "total_size_gb": sum(float(file["size_gb"]) for file in folder.get("files", [])),
                "issues": []
            }
        }

        # Update file status within this folder
        if "files" in folder and folder["files"]:
            updated_folder["files"] = []
            for file in folder["files"]:
                if file == invalid_file:
                    updated_folder["validation"]["valid"] = False  # Folder contains an invalid file
                    updated_folder["validation"]["issues"].append({
                        "file": file["path"],
                        "issue": "Corrupted file detected"
                    })
                    file["status"] = "Invalid"
                else:
                    file["status"] = "Valid"
                updated_folder["files"].append(file)

        # Recursively process subfolders
        if "subfolders" in folder and folder["subfolders"]:
            updated_folder["subfolders"] = {
                name: update_folder(subfolder) for name, subfolder in folder["subfolders"].items()
            }

        return updated_folder

    for folder_name, folder in folder_data.items():
        updated_data[folder_name] = update_folder(folder)

    return updated_data

@router.post("/validate/")
async def validate_folder(data: Dict[str, Any]):  
    """
    Takes the folder structure from request, ensures all files are valid except for
    one randomly chosen file, and returns the modified response.
    """
    validated_data = generate_mock_validation(data)
    return validated_data
