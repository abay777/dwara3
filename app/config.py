from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database settings
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    # Other settings
    STAGING_FOLDER: str
    PROXY_OUTPUT_FOLDER: str
    ATEMPO_API_URL: str
    ATEMPO_API_KEY: str

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"

settings = Settings()