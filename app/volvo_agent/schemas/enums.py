from enum import Enum


class CarModel(str, Enum):
    """
    Enum for supported car models.
    Inheriting from str makes it serialize to JSON as a simple string.
    """

    EX90 = "EX90"
    EX30 = "EX30"
    EX60 = "EX60"


