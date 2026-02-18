from typing import Optional

from pydantic import BaseModel, Field


class Location(BaseModel):
    """
    Represents a geographical location.
    """
    city: str = Field(..., description="The city name.")
    nation: str = Field(..., description="The country or nation name.")
    street: Optional[str] = Field(default=None, description="The street address (optional).")
    lat: Optional[float] = Field(default=None, description="Latitude (optional).")
    lng: Optional[float] = Field(default=None, description="Longitude (optional).")


class Retailer(BaseModel):
    """
    Represents a Volvo retailer/dealership.
    """
    id: str = Field(..., description="The unique identifier of the retailer.")
    name: str = Field(..., description="The name of the retailer.")
    location: Location = Field(..., description="The location of the retailer.")
    phone: Optional[str] = Field(default=None, description="The retailer's phone number (optional).")


class UserInfo(BaseModel):
    """
    Represents user information for booking.
    """
    name: str = Field(..., description="The user's full name.")
    email: str = Field(..., description="The user's email address.")
    height: Optional[str] = Field(default=None, description="The user's height preference (optional).")
    music: Optional[str] = Field(default=None, description="The user's music preference (optional).")
    light: Optional[str] = Field(default=None, description="The user's lighting/ambience preference (optional).")


class AppointmentSlot(BaseModel):
    """
    Represents a specific appointment slot.
    """
    date: str = Field(..., description="The date of the appointment (e.g., YYYY-MM-DD).")
    time: str = Field(..., description="The time of the appointment (e.g., HH:MM).")
    duration: Optional[str] = Field(default=None, description="Duration of the appointment (optional).")
