from api.models import FolderValidationRequest, ValidationResponse
from typing import Dict, List

def validate_folder(data: Dict[str, FolderValidationRequest]) -> Dict[str, ValidationResponse]:
    response_data = {}

    for folder_name, folder in data.items():
        issues = []
        total_files = len(folder.files)
        total_size = sum(file.size_gb for file in folder.files)

        # Detect missing subtitle files
        for file in folder.files:
            if file.type == "video":
                subtitle_path = file.path.replace(file.path.split(".")[-1], "srt")
                if not any(f.path == subtitle_path for f in folder.files):
                    issues.append({"file": file.path, "issue": "Missing subtitle file"})

        # Validate subfolders recursively
        for subfolder_name, subfolder in folder.subfolders.items():
            subfolder_response = validate_folder({subfolder_name: subfolder})
            subfolder_key = list(subfolder_response.keys())[0]
            total_files += subfolder_response[subfolder_key].files_count
            total_size += subfolder_response[subfolder_key].total_size_gb
            issues.extend(subfolder_response[subfolder_key].issues)

        response_data[folder_name] = ValidationResponse(
            valid=len(issues) == 0,
            files_count=total_files,
            total_size_gb=total_size,
            issues=issues
        )

    return response_data
