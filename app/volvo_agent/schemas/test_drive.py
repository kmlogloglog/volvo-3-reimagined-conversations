from typing import Literal, Optional

from pydantic import BaseModel, Field


class TestDriveRequest(BaseModel):
    """
    Represents the parameters for booking a test drive or checking availability.
    """

    first_name: str = Field(..., description="The first name of the user.")
    email: Optional[str] = Field(default=None, description="The email address of the user.")
    location: str = Field(
        ..., description="The location where the user wants to test drive."
    )
    preferred_date_time: str = Field(
        ..., description="The preferred date and time for the test drive."
    )
    retailer_name: str = Field(
        default="", description="The name of the retailer (optional)."
    )
    retailer_address: str = Field(
        default="", description="The address of the retailer (optional)."
    )
    retailer_id: str = Field(
        default="", description="The ID of the retailer (optional)."
    )
    retailer_lat: float = Field(
        default=0.0, description="The latitude of the retailer (optional)."
    )
    retailer_lng: float = Field(
        default=0.0, description="The longitude of the retailer (optional)."
    )
    height: str = Field(
        default="", description="The user's height preference (optional)."
    )
    music_preference: str = Field(
        default="", description="The user's music preference (optional)."
    )
    ambience_preference: str = Field(
        default="", description="The user's ambience preference (optional)."
    )
    action: Literal["check", "book"] = Field(
        default="book",
        description="The action to perform: 'check' for availability or 'book' for booking.",
    )
