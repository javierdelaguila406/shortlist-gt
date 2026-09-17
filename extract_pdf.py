#!/usr/bin/env python3
import sys
import pdfplumber
import re

def extract_text_from_pdf(pdf_path):
    """Extrae texto de PDF y limpia formato"""
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    # Limpiar espacios múltiples y saltos
                    extracted = re.sub(r'\s+', ' ', extracted)
                    text += extracted + "\n"

        if text.strip():
            return text.strip()
        else:
            # Si no se extrajo texto, intentar con otro método
            return None
    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    pdf_path = sys.argv[1]
    text = extract_text_from_pdf(pdf_path)

    if text:
        # Handle encoding issues
        try:
            sys.stdout.buffer.write(text.encode('utf-8'))
        except:
            print(text.encode('utf-8', errors='ignore').decode('utf-8'))
    else:
        print("")
