from reportlab.pdfgen import canvas
import PyPDF2


def add_checkmark_to_pdf(input_pdf_path, output_pdf_path, page_number, x, y):
    checkmark_pdf_path = "checkmark_overlay.pdf"
    c = canvas.Canvas(checkmark_pdf_path)

    c.setFont("ZapfDingbats", 24)

    c.drawString(x, y, "\u2713")

    c.save()

    original_pdf = PyPDF2.PdfReader(input_pdf_path)
    output_pdf = PyPDF2.PdfWriter()

    with open(checkmark_pdf_path, "rb") as checkmark_file:
        checkmark_pdf = PyPDF2.PdfReader(checkmark_file)

        number_pages = len(original_pdf.pages)
        for page_num in range(number_pages):
            page = original_pdf.pages[page_num]

            page.merge_page(checkmark_pdf.pages[0])
            output_pdf.add_page(page)

    with open(output_pdf_path, "wb") as output_file:
        output_pdf.write(output_file)


input_pdf = r"J:\\Drone\\_3J Flight Log\\_Flight Checklist Form\\Flight Checklist Form-[PROJECT].pdf"
output_pdf = (
    r"J:\\Drone\\_3J Flight Log\\_Flight Checklist Form\\Flight Checklist Form-test.pdf"
)
x_position = 100
y_position = 200
page_number = 0
add_checkmark_to_pdf(input_pdf, output_pdf, page_number, x_position, y_position)
