from arcgis.features import FeatureLayer
import pandas as pd
import os
import pandas as pd
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfFileReader, PdfFileWriter

# Retreive data from drone flight AGOL layer
layer_url = "https://services3.arcgis.com/pZZTDhBBLO3B9dnl/arcgis/rest/services/Drone_flights/FeatureServer/0"
drone_flights_layer = FeatureLayer(layer_url)
features = drone_flights_layer.query(where="1=1", out_fields="*").features
data = [f.attributes for f in features]
df = pd.DataFrame(data)
print(df)


def fill_pdf_text(record, output_filename, template_pdf, fields, output_dir):
    output_filepath = os.path.join(output_dir, output_filename)

    reader = PdfFileReader(template_pdf)
    writer = PdfFileWriter()

    temp_pdf = output_filepath.replace(".pdf", "_temp.pdf")
    can = canvas.Canvas(temp_pdf, pagesize=letter)

    can.setFont("Helvetica", 12)

    for field, details in fields.items():
        value = record.get(field, "")
        field_type, page, coordinates_in_inches = (
            details["type"],
            details["page"],
            details["coordinates"],
        )

        if field_type == "text":
            x_inch, y_inch = coordinates_in_inches
            x_pt, y_pt = (
                x_inch * 72,
                (11 - y_inch) * 72,
            )

            if page == 1:
                can.drawString(x_pt, y_pt, str(value))
            elif page == 2:
                can.showPage()
                can.drawString(x_pt, y_pt, str(value))

    can.save()

    with open(temp_pdf, "rb") as temp_f:
        reader_temp = PdfFileReader(temp_f)
        for i in range(len(reader.pages)):
            page = reader.pages[i]
            if i < len(reader_temp.pages):
                page.mergePage(reader_temp.pages[i])
            writer.addPage(page)

    with open(output_filepath, "wb") as output_f:
        writer.write(output_f)

    os.remove(temp_pdf)


def fill_pdf_checks(
    record, output_filename, template_pdf, checklist_lookup, output_dir
):
    output_filepath = os.path.join(output_dir, output_filename)
    reader = PdfFileReader(template_pdf)
    writer = PdfFileWriter()

    temp_pdf = output_filepath.replace(".pdf", "_temp.pdf")
    can = canvas.Canvas(temp_pdf, pagesize=letter)

    checklist_items_str = record.get("checklistItems", "")
    checklist_items = checklist_items_str.split(",")

    can.setFont("ZapfDingbats", 22)
    for item in checklist_items:
        if item.strip() in checklist_lookup:
            checkbox_info = checklist_lookup[item.strip()]
            page = checkbox_info["page"]
            x_inch, y_inch = checkbox_info["coordinates"]
            x_pt, y_pt = (
                x_inch * 72,
                (11 - y_inch) * 72,
            )

            if page == 1:
                can.drawString(x_pt, y_pt, "\u2713")
            elif page == 2:
                can.showPage()
                can.drawString(x_pt, y_pt, "\u2713")

    can.save()

    with open(temp_pdf, "rb") as temp_f:
        reader_temp = PdfFileReader(temp_f)
        for i in range(len(reader.pages)):
            page = reader.pages[i]
            if i < len(reader_temp.pages):
                page.mergePage(reader_temp.pages[i])
            writer.addPage(page)

    with open(output_filepath, "wb") as output_f:
        writer.write(output_f)

    os.remove(temp_pdf)


fields_coordinates = {
    "pilot": {
        "type": "text",
        "page": 1,
        "coordinates": (4.1, 2.0),
    },
    "project": {
        "type": "text",
        "page": 1,
        "coordinates": (3.22, 2.4),
    },
    "FlightTime": {
        "type": "text",
        "page": 1,
        "coordinates": (1.5, 2.89),
    },
    "weather": {
        "type": "text",
        "page": 1,
        "coordinates": (3.13, 3.36),
    },
    "altitude": {
        "type": "text",
        "page": 2,
        "coordinates": (2.51, 6.88),
    },
    "incident": {
        "type": "text",
        "page": 2,
        "coordinates": (2.56, 7.67),
    },
}

checklist_lookup = {
    "flight-plan": {"page": 1, "coordinates": (1.25, 4.42)},
    "site-survey": {"page": 1, "coordinates": (1.25, 4.81)},
    "weather-check": {"page": 1, "coordinates": (1.25, 5.21)},
    "equipment": {"page": 1, "coordinates": (1.25, 5.79)},
    "notams": {"page": 1, "coordinates": (1.25, 7.14)},
    "airspace": {"page": 1, "coordinates": (1.25, 7.53)},
    "software": {"page": 1, "coordinates": (1.25, 8.11)},
    "permissions": {"page": 1, "coordinates": (1.25, 8.69)},
    "ppe": {"page": 1, "coordinates": (1.25, 9.1)},
    "home-point": {"page": 2, "coordinates": (1.25, 1.93)},
    "drone-inspection": {"page": 2, "coordinates": (1.25, 2.33)},
    "equipment-secured": {"page": 2, "coordinates": (1.25, 2.53)},
    "equipment-remove": {"page": 2, "coordinates": (1.25, 3.13)},
    "calibrations": {"page": 2, "coordinates": (1.25, 3.51)},
    "signals": {"page": 2, "coordinates": (1.25, 3.9)},
    "obstacles": {"page": 2, "coordinates": (1.25, 4.13)},
    "post-inspection": {"page": 2, "coordinates": (1.25, 5.32)},
    "pack-equipment": {"page": 2, "coordinates": (1.25, 5.53)},
    "sync-app": {"page": 2, "coordinates": (1.25, 5.92)},
    "flight-altitude": {"page": 2, "coordinates": (1.25, 6.93)},
    "incident": {"page": 2, "coordinates": (1.25, 7.13)},
}


template_pdf_path = r"J:\Drone\_3J Flight Log\_Flight Checklist Form\Flight Checklist Form-[PROJECT].pdf"
output_dir = r"C:\3japps\DroneChecklist\finished_checklists"

# Loop through the AGOL data and create a PDF for each record
for idx, record in df.iterrows():
    output_filename = f"output_{idx + 1}.pdf"
    fill_pdf_text(
        record,
        output_filename,
        template_pdf_path,
        fields_coordinates,
        output_dir,
    )
    int_output = os.listdir(output_dir)
    for output in int_output:
        fill_pdf_checks(
            record,
            f"output_{idx + 1}_checked.pdf",
            os.path.join(output_dir, output),
            checklist_lookup,
            output_dir,
        )
    print(f"PDF {output_filename} generated")
