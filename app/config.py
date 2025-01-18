from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    STAGING_FOLDER: str
    PROXY_OUTPUT_FOLDER: str
    ATEMPO_API_URL: str
    ATEMPO_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()