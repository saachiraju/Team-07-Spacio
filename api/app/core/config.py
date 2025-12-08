from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str = Field(default="mongodb://localhost:27017")
    database_name: str = Field(default="spacio")
    jwt_secret: str = Field(default="super-secret-key")  # TODO: replace for prod
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60 * 24)
    cors_origins: List[str] = Field(default=["*"])
    service_fee_rate: float = Field(default=0.10)
    refundable_deposit: float = Field(default=50.0)

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

