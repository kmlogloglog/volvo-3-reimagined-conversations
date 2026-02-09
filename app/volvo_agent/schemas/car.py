from typing import Literal

from pydantic import BaseModel, Field, model_validator

from ..utils import load_car_configurations

CAR_CONFIGS = load_car_configurations() or {}


class CarConfiguration(BaseModel):
    """
    Represents the full configuration of a car.
    Validates selections against the knowledge base.
    """

    model: Literal["EX30", "EX60", "EX90"] = Field(..., description="The car model.")
    exterior: str | None = Field(
        default=None,
        description="The selected exterior color for the car configuration (e.g. vapour_grey, onyx_black).",
    )
    interior: str | None = Field(
        default=None,
        description="The selected interior for the car configuration (e.g. nordico_charcoal, nappa_cardamom).",
    )
    wheels: str | None = Field(
        default=None,
        description="The selected wheels type for the car configuration (e.g. 20, 21, 22Y).",
    )

    @model_validator(mode="after")
    def set_defaults_and_validate(self) -> "CarConfiguration":
        model_key = self.model
        model_data = CAR_CONFIGS.get(model_key)

        if not model_data:
            raise ValueError(
                f"Invalid model '{model_key}'. Valid options: {list(CAR_CONFIGS.keys())}"
            )

        base_config = model_data.get("base_configuration", {})

        # 1. Set default exteriors
        if self.exterior is None:
            self.exterior = base_config.get("exteriors")
            if not self.exterior:
                # Fallback to first available exteriors
                available_exteriors = model_data.get("exteriors", {})
                if available_exteriors:
                    self.exterior = next(iter(available_exteriors))

        # 2. Set default interiors
        if self.interior is None:
            self.interior = base_config.get("interiors")
            if not self.interior:
                # Fallback to first available interiors
                available_interiors = model_data.get("interiors", {})
                if available_interiors:
                    self.interior = next(iter(available_interiors))

        # 3. Set default wheels
        if self.wheels is None:
            self.wheels = base_config.get("wheels")
            if not self.wheels:
                # Fallback to first available wheels
                available_wheels = model_data.get("wheels", {})
                if available_wheels:
                    self.wheels = next(iter(available_wheels))

        # 4. Validate Exteriors
        if self.exterior:
            valid_exteriors = model_data.get("exteriors", {})
            if self.exterior not in valid_exteriors:
                # For an agent, strict validation prevents hallucinations.
                raise ValueError(
                    f"Invalid exteriors '{self.exterior}' for model {self.model}. Valid options: {list(valid_exteriors.keys())}"
                )

        # 5. Validate Interiors
        if self.interior:
            valid_interiors = model_data.get("interiors", {})
            if self.interior not in valid_interiors:
                raise ValueError(
                    f"Invalid interior '{self.interior}' for model {self.model}. Valid options: {list(valid_interiors.keys())}"
                )

        # 6. Validate Wheels
        if self.wheels:
            valid_wheels = model_data.get("wheels", {})
            if str(self.wheels) not in valid_wheels:
                raise ValueError(
                    f"Invalid wheels '{self.wheels}' for model {self.model}. Valid options: {list(valid_wheels.keys())}"
                )

        return self
