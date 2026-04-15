"""OpenAI function calling tool definitions for Freja."""

TOOLS = [
    {
        "type": "function",
        "name": "select_model",
        "description": "Selects the car model and returns its silhouette image to the frontend.",
        "parameters": {
            "type": "object",
            "properties": {
                "model_name": {
                    "type": "string",
                    "description": "The name of the model to select (e.g., 'EX30', 'EX60', 'EX90').",
                }
            },
            "required": ["model_name"],
        },
    },
    {
        "type": "function",
        "name": "select_exterior_color",
        "description": "Selects the exterior color and returns gradient stops for the model.",
        "parameters": {
            "type": "object",
            "properties": {
                "color_id": {
                    "type": "string",
                    "description": "The ID of the color to select (e.g., 'cloud_blue', 'onyx_black', 'vapour_grey').",
                }
            },
            "required": ["color_id"],
        },
    },
    {
        "type": "function",
        "name": "select_wheel",
        "description": "Selects the wheel option for the configured model.",
        "parameters": {
            "type": "object",
            "properties": {
                "wheel_id": {
                    "type": "string",
                    "description": "The ID of the wheel to select (e.g., '19_5', '20', '21').",
                }
            },
            "required": ["wheel_id"],
        },
    },
    {
        "type": "function",
        "name": "select_interior",
        "description": "Selects the interior option for the configured model.",
        "parameters": {
            "type": "object",
            "properties": {
                "interior_id": {
                    "type": "string",
                    "description": "The ID of the interior to select (e.g., 'indigo', 'charcoal', 'mist').",
                }
            },
            "required": ["interior_id"],
        },
    },
    {
        "type": "function",
        "name": "display_car_configuration",
        "description": "Displays the final car configuration with all associated images as a carousel. Call this after model, exterior, wheels, and interior are all selected.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "type": "function",
        "name": "find_retailer",
        "description": "Finds the closest Volvo retailer to the user's location. Call this when the user provides their city or location for a test drive.",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "object",
                    "description": "The user's location.",
                    "properties": {
                        "city": {
                            "type": "string",
                            "description": "The city name.",
                        },
                        "nation": {
                            "type": "string",
                            "description": "The country name.",
                        },
                        "street": {
                            "type": "string",
                            "description": "The street address (optional).",
                        },
                    },
                    "required": ["city", "nation"],
                }
            },
            "required": ["location"],
        },
    },
    {
        "type": "function",
        "name": "book_test_drive",
        "description": "Books a test drive for the user's configured Volvo. Call after collecting retailer, user info (name, email), and preferred appointment slot.",
        "parameters": {
            "type": "object",
            "properties": {
                "retailer": {
                    "type": "object",
                    "description": "The selected retailer.",
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "location": {
                            "type": "object",
                            "properties": {
                                "city": {"type": "string"},
                                "nation": {"type": "string"},
                                "street": {"type": "string"},
                                "lat": {"type": "number"},
                                "lng": {"type": "number"},
                            },
                        },
                        "phone": {"type": "string"},
                    },
                    "required": ["name", "location"],
                },
                "user_info": {
                    "type": "object",
                    "description": "The user's personal information.",
                    "properties": {
                        "name": {"type": "string", "description": "Full name."},
                        "email": {"type": "string", "description": "Email address."},
                        "height": {"type": "string", "description": "Height for seat adjustment."},
                        "music": {"type": "string", "description": "Music preference."},
                        "light": {"type": "string", "description": "Ambient light preference."},
                    },
                    "required": ["name", "email"],
                },
                "appointment_slot": {
                    "type": "object",
                    "description": "The desired appointment slot.",
                    "properties": {
                        "date": {"type": "string", "description": "Date in YYYY-MM-DD format."},
                        "time": {"type": "string", "description": "Time in HH:MM format."},
                    },
                    "required": ["date", "time"],
                },
            },
            "required": ["retailer", "user_info", "appointment_slot"],
        },
    },
    {
        "type": "function",
        "name": "save_user_insight",
        "description": "Saves a structured insight about the user. Use to persist profiling data (Phase 1) or personal information.",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "The type of insight.",
                    "enum": [
                        "passenger_count",
                        "driving_environment",
                        "daily_car_use",
                        "weekend_vibe",
                        "current_car",
                        "full_name",
                        "email",
                        "location",
                    ],
                },
                "value": {
                    "type": "string",
                    "description": "The value for this category.",
                },
            },
            "required": ["category", "value"],
        },
    },
]
