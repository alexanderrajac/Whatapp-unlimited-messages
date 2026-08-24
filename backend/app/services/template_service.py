import re
from typing import Dict, Any, List

class TemplateService:
    @staticmethod
    def extract_variables(text: str) -> List[str]:
        """Extract all unique placeholder variable names from template text (e.g. {{name}})."""
        if not text:
            return []
        matches = re.findall(r"\{\{\s*([a-zA-Z0-9_\s]+)\s*\}\}", text)
        return list(dict.fromkeys([m.strip() for m in matches]))

    @classmethod
    def render_message(cls, template_text: str, contact_data: Dict[str, Any]) -> str:
        """
        Replace {{variable}} placeholders with contact's attributes or custom fields.
        Supports case-insensitive matching and standard fallbacks.
        """
        if not template_text:
            return ""

        rendered = template_text
        custom_fields = contact_data.get("custom_fields", {})
        
        # Flatten all possible lookups into a lowercase dict
        lookup = {
            "name": contact_data.get("name", ""),
            "fullname": contact_data.get("name", ""),
            "customer_name": contact_data.get("name", ""),
            "phone": contact_data.get("phone_number", ""),
            "mobile": contact_data.get("phone_number", ""),
            "city": contact_data.get("city", ""),
            "email": contact_data.get("email", ""),
        }

        # Add all custom fields
        for k, v in custom_fields.items():
            lookup[str(k).lower().strip()] = str(v)
            lookup[str(k).strip()] = str(v)

        def replace_var(match):
            var_name = match.group(1).strip()
            # Try exact match
            if var_name in lookup:
                return str(lookup[var_name])
            # Try lowercase match
            lower_name = var_name.lower()
            if lower_name in lookup:
                return str(lookup[lower_name])
            # Try removing spaces/underscores
            sanitized = re.sub(r'[\s_]', '', lower_name)
            for k, val in lookup.items():
                if re.sub(r'[\s_]', '', k) == sanitized:
                    return str(val)
            # If not found, leave as is or return empty
            return match.group(0)

        rendered = re.sub(r"\{\{\s*([a-zA-Z0-9_\s]+)\s*\}\}", replace_var, rendered)
        return rendered

template_service = TemplateService()
