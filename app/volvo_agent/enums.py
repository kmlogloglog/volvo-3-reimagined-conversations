from enum import Enum

class CarModel(str, Enum):
    """
    Enum for supported car models.
    Inheriting from str makes it serialize to JSON as a simple string.
    """
    EX90 = "EX90"

class InteriorType(str, Enum):
    """
    Enum for supported interior types.
    The value must exactly match the 'interior' field in interiors.json.
    """
    CARDAMOM_QUILTED = "Cardamom Quilted"
    CHARCOAL_NORDICO = "Charcoal Nordico"
    DAWN_QUILTED_NORDICO = "Dawn Quilted Nordico"

class Color(str, Enum):
    """
    Enum for supported car colors.
    The value must exactly match the 'color' field in colors.json.
    """
    PLATINUM_GREY = "Platinum Grey"
    SAND_DUNE = "Sand Dune"
    DENIM_BLUE = "Denim Blue"
    ONYX_BLACK = "Onyx Black"
    VAPOUR_GREY = "Vapour Grey"
    SILVER_DAWN = "Silver Dawn"
    CRYSTAL_WHITE = "Crystal White"
    MULBERRY_RED = "Mulberry Red"
