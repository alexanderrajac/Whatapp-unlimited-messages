import io
import re
import pandas as pd
from typing import List, Dict, Any, Tuple
from app.core.config import settings

class CSVService:
    @staticmethod
    def normalize_phone(raw_phone: Any, default_country_code: str = settings.DEFAULT_COUNTRY_CODE) -> str:
        """
        Normalize phone number by stripping special characters,
        ensuring proper country code prefix.
        """
        if pd.isna(raw_phone) or raw_phone is None:
            return ""
        
        # Convert to string and strip float '.0' if present
        phone_str = str(raw_phone).strip()
        if phone_str.endswith('.0'):
            phone_str = phone_str[:-2]
            
        digits = re.sub(r'[^\d]', '', phone_str)
        if not digits:
            return ""

        # Remove leading 0 if present
        if digits.startswith('0') and len(digits) > 10:
            digits = digits[1:]
        elif digits.startswith('0') and len(digits) == 11:
            digits = digits[1:]

        # If standard 10 digits (e.g. India), attach country code
        if len(digits) == 10:
            digits = f"{default_country_code}{digits}"

        return digits

    @classmethod
    def parse_file(cls, file_bytes: bytes, filename: str) -> Tuple[List[Dict[str, Any]], List[str], Dict[str, str]]:
        """
        Parse CSV or Excel file bytes into a list of normalized contact dictionaries.
        Returns (records, detected_columns, column_mapping).
        """
        if filename.endswith('.csv'):
            # Try utf-8 then latin1
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), dtype=str)
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding='latin1', dtype=str)
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(file_bytes), dtype=str)
        else:
            raise ValueError("Unsupported file format. Please upload a .csv or .xlsx file.")

        df = df.fillna("")
        raw_columns = list(df.columns)
        
        # Auto-detect standard columns
        mapping = {}
        for col in raw_columns:
            clean_col = col.strip().lower()
            if not mapping.get("phone") and any(k in clean_col for k in ["phone", "mobile", "whatsapp", "contact", "tel", "cell", "number"]):
                mapping["phone"] = col
            elif not mapping.get("name") and any(k in clean_col for k in ["name", "full name", "customer", "client", "person"]):
                mapping["name"] = col
            elif not mapping.get("city") and any(k in clean_col for k in ["city", "location", "town", "place", "state"]):
                mapping["city"] = col
            elif not mapping.get("email") and "email" in clean_col:
                mapping["email"] = col
            elif not mapping.get("tags") and any(k in clean_col for k in ["tag", "group", "category"]):
                mapping["tags"] = col

        # Fallback if phone column not found: look for a column with digits
        if not mapping.get("phone"):
            for col in raw_columns:
                sample_val = str(df[col].iloc[0]) if len(df) > 0 else ""
                digits_count = len(re.sub(r'[^\d]', '', sample_val))
                if digits_count >= 8:
                    mapping["phone"] = col
                    break

        records = []
        for _, row in df.iterrows():
            phone_col = mapping.get("phone")
            raw_phone = row.get(phone_col, "") if phone_col else ""
            cleaned_phone = cls.normalize_phone(raw_phone)
            
            if not cleaned_phone:
                continue  # skip rows without valid phone

            name_col = mapping.get("name")
            name = str(row.get(name_col, "")).strip() if name_col else ""

            city_col = mapping.get("city")
            city = str(row.get(city_col, "")).strip() if city_col else ""

            email_col = mapping.get("email")
            email = str(row.get(email_col, "")).strip() if email_col else ""

            tags_col = mapping.get("tags")
            tags = [t.strip() for t in str(row.get(tags_col, "")).split(",") if t.strip()] if tags_col else []

            # Gather all other columns into custom_fields
            custom_fields = {}
            for col in raw_columns:
                val = str(row[col]).strip()
                custom_fields[col] = val
                # Also store lowercase key for easy variable access
                custom_fields[col.lower()] = val

            records.append({
                "name": name,
                "phone_number": cleaned_phone,
                "raw_phone": str(raw_phone),
                "city": city,
                "email": email,
                "tags": tags,
                "custom_fields": custom_fields
            })

        return records, raw_columns, mapping

csv_service = CSVService()
