from reportlab.pdfgen import canvas
import PyPDF2
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import pandas as pd
import math
from arcgis.gis import GIS
from arcgis.features import FeatureLayer


def get_agol_data(layer_url, where_clause="1=1"):
    """
    Retrieve data from public AGOL feature layer
    Returns a list of dictionaries, each representing a feature
    """
    gis = GIS()
    layer = FeatureLayer(layer_url)
    features = layer.query(where=where_clause).features
    return [feature.attributes for feature in features]


def load_lookup_table(csv_path):
    """
    Loads the lookup table from CSV file
    CSV structure: field,type,page,x,y
    """
    lookup_table = []
    df = pd.read_csv(csv_path)

    for _, row in df.iterrows():
        lookup_table.append(
            {
                "field_name": row["field"],
                "field_type": row["type"],
                "page_number": int(row["page"]),
                "x": float(row["x"]),
                "y": float(row["y"]),
            }
        )

    return lookup_table


def clean_field_value(value):
    """
    Clean and validate field values
    Returns None if value is invalid/empty
    """
    if pd.isna(value) or value is None:
        return None
    elif isinstance(value, float) and math.isnan(value):
        return None
    elif isinstance(value, (int, float)):
        return str(int(value)) if value.is_integer() else str(value)
    return str(value)


def create_overlay_pdf(field_type, value, x, y, page_number):
    """Creates a single-page PDF overlay with either text or checkmark"""
    overlay_path = f"temp_overlay_{page_number}.pdf"
    c = canvas.Canvas(overlay_path)

    if field_type.lower() == "checkbox":
        c.setFont("ZapfDingbats", 24)
        # Only draw checkmark if value is truthy
        if value and str(value).lower() not in ("false", "0", "none", "nan"):
            c.drawString(x, y, "✓")
    else:  # Text field
        c.setFont("Helvetica", 12)
        cleaned_value = clean_field_value(value)
        if cleaned_value is not None:
            c.drawString(x, y, cleaned_value)

    c.save()
    return overlay_path


def process_pdf_with_data(input_pdf_path, output_pdf_path, agol_data, lookup_csv_path):
    """
    Process PDF form with AGOL data using lookup table from CSV
    """
    lookup_table = load_lookup_table(lookup_csv_path)
    original_pdf = PyPDF2.PdfReader(input_pdf_path)
    output_pdf = PyPDF2.PdfWriter()
    page_overlays = {}

    # Debug: Print all AGOL data fields and their values
    print("\nAGOL Data Fields:")
    for field, value in agol_data.items():
        print(f"Field: {field}, Value: {value}, Type: {type(value)}")

    # Process each field in the lookup table
    for field_info in lookup_table:
        field_name = field_info["field_name"]

        # Debug: Print processing attempt
        print(f"\nProcessing field: {field_name}")

        # Skip if field isn't in AGOL data
        if field_name not in agol_data:
            print(f"Field {field_name} not found in AGOL data")
            continue

        value = agol_data[field_name]

        # Skip if value is invalid
        if pd.isna(value) or value is None:
            print(f"Field {field_name} has invalid value: {value}")
            continue

        print(f"Value for {field_name}: {value} (Type: {type(value)})")

        page_num = field_info["page_number"]

        try:
            overlay_path = create_overlay_pdf(
                field_info["field_type"],
                value,
                field_info["x"],
                field_info["y"],
                page_num,
            )

            if page_num not in page_overlays:
                page_overlays[page_num] = []
            page_overlays[page_num].append(overlay_path)

            print(f"Successfully created overlay for {field_name}")

        except Exception as e:
            print(f"Error creating overlay for field {field_name}: {str(e)}")
            continue

    # Process each page of the original PDF
    for page_num in range(len(original_pdf.pages)):
        page = original_pdf.pages[page_num]

        if page_num in page_overlays:
            for overlay_path in page_overlays[page_num]:
                with open(overlay_path, "rb") as overlay_file:
                    overlay_pdf = PyPDF2.PdfReader(overlay_file)
                    page.merge_page(overlay_pdf.pages[0])

        output_pdf.add_page(page)

    with open(output_pdf_path, "wb") as output_file:
        output_pdf.write(output_file)


def main():
    # AGOL layer URL for public layer
    layer_url = "https://services3.arcgis.com/pZZTDhBBLO3B9dnl/arcgis/rest/services/Drone_flights/FeatureServer"

    # Get data from AGOL
    try:
        agol_features = get_agol_data(layer_url)
        print(f"Successfully retrieved {len(agol_features)} features from the layer")
    except Exception as e:
        print(f"Error retrieving data from AGOL: {str(e)}")
        return

    # Paths
    input_pdf = r"J:\Drone\_3J Flight Log\_Flight Checklist Form\Flight Checklist Form-[PROJECT].pdf"
    lookup_csv = r"C:\3japps\DroneChecklist\locationlookup.csv"

    # Process each feature from AGOL
    for i, feature_data in enumerate(agol_features, 1):
        print(f"\nProcessing feature {i}")

        # Create output PDF path
        output_pdf = f"J:\Drone\_3J Flight Log\_Flight Checklist Form\Flight Checklist Form-{feature_data.get('ID', f'feature_{i}')}.pdf"

        try:
            process_pdf_with_data(input_pdf, output_pdf, feature_data, lookup_csv)
            print(f"Successfully processed feature {i}")
        except Exception as e:
            print(f"Error processing feature {i}: {str(e)}")


if __name__ == "__main__":
    main()
