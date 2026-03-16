from enum import StrEnum


class InsightCategory(StrEnum):
    # Phase 1: Discovery profiling
    passenger_count = "passenger_count"
    driving_environment = "driving_environment"
    daily_car_use = "daily_car_use"
    weekend_vibe = "weekend_vibe"
    # Phase 5: CRM / personal info
    full_name = "full_name"
    email = "email"
    location = "location"
