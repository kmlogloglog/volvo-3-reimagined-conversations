from enum import StrEnum


class InsightCategory(StrEnum):
    # Phase 1: Discovery profiling
    passenger_count = "passenger_count"
    driving_environment = "driving_environment"
    daily_car_use = "daily_car_use"
    weekend_vibe = "weekend_vibe"
    current_car = "current_car"
    # Personal info (collected throughout)
    full_name = "full_name"
    email = "email"
    location = "location"
