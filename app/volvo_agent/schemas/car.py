import logging
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

from ..utils import fuzzy_match, load_car_configurations

logger = logging.getLogger(__name__)
CAR_CONFIGS = load_car_configurations()


class CarConfiguration(BaseModel):
    """
    Represents the full configuration of a car.
    Validates selections against the knowledge base.
    """

    model: Literal["EX30", "EX60", "EX90"] = Field(..., description="The car model.")
    exterior: Optional[str] = Field(
        default=None,
        description="The selected exterior color for the car configuration (e.g. vapour_grey, onyx_black).",
    )
    interior: Optional[str] = Field(
        default=None,
        description="The selected interior for the car configuration (e.g. nordico_charcoal, nappa_cardamom).",
    )
    wheels: Optional[str] = Field(
        default=None,
        description="The selected wheels type for the car configuration (e.g. 20, 21, 22Y).",
    )

    @model_validator(mode="after")
    def set_defaults_and_validate(self) -> "CarConfiguration":
        available_models = list(CAR_CONFIGS.keys())

        if self.model not in available_models:
            # We default to the closest match to avoid disrupting the agent's flow
            logger.error(
                f"Invalid model '{self.model}'. Valid options: {available_models}"
            )
            matched_model = fuzzy_match(self.model, available_models)
            self.model = matched_model  # type: ignore[assignment]

        model_data = CAR_CONFIGS.get(self.model, {})
        base_config = model_data.get("base_configuration", {})
        available_exteriors = model_data.get("exteriors", {}).keys()
        available_interiors = model_data.get("interiors", {}).keys()
        available_wheels = model_data.get("wheels", {}).keys()

        # 1. Set default exteriors if not provided and validate/fuzzy match if provided
        if self.exterior is None:
            self.exterior = base_config.get("exteriors")
            if not self.exterior:
                self.exterior = next(iter(available_exteriors), None)
        else:
            if self.exterior not in available_exteriors:
                logger.error(
                    f"Invalid exterior '{self.exterior}'. Valid options: {available_exteriors}"
                )
                # We default to the closest match to avoid disrupting the agent's flow
                self.exterior = fuzzy_match(self.exterior, available_exteriors)

        # 2. Set default interiors if not provided and validate/fuzzy match if provided
        if self.interior is None:
            self.interior = base_config.get("interiors")
            if not self.interior:
                self.interior = next(iter(available_interiors), None)
        else:
            if self.interior not in available_interiors:
                logger.error(
                    f"Invalid interior '{self.interior}'. Valid options: {available_interiors}"
                )
                # We default to the closest match to avoid disrupting the agent's flow
                self.interior = fuzzy_match(self.interior, available_interiors)

        # 3. Set default wheels if not provided and validate/fuzzy match if provided
        if self.wheels is None:
            self.wheels = base_config.get("wheels")
            if not self.wheels:
                self.wheels = next(iter(available_wheels), None)
        else:
            if self.wheels not in available_wheels:
                logger.error(
                    f"Invalid wheels '{self.wheels}'. Valid options: {available_wheels}"
                )
                # We default to the closest match to avoid disrupting the agent's flow
                self.wheels = fuzzy_match(str(self.wheels), available_wheels)

        return self
