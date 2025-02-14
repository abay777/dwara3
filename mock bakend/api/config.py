import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration Variables
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
