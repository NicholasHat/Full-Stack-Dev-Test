"""PDF rendering helpers for estimates.

WeasyPrint is used when available. If the required native libraries are missing,
the module falls back to a small pure-Python PDF generator so the endpoint still works.
"""

from __future__ import annotations

import html
import textwrap
from io import BytesIO

from app.schemas.estimate import EstimateRead

try:
    from weasyprint import HTML
except Exception:  # pragma: no cover
    HTML = None


def _money(value: float | None) -> str:
    if value is None:
        return "$0.00"
    return f"${value:,.2f}"


def _estimate_to_html(estimate: EstimateRead) -> str:
    labor_row = ""
    if estimate.labor:
        labor_row = (
            f"<tr><td>Labor</td><td>{html.escape(estimate.labor.jobType or '')}"
            f" / {html.escape(estimate.labor.level or '')}</td>"
            f"<td>{estimate.labor.hoursChosen or 0}</td>"
            f"<td>{_money(estimate.labor.hourlyRate)}</td>"
            f"<td>{_money(estimate.labor.laborTotal)}</td></tr>"
        )

    equipment_rows = "".join(
        (
            f"<tr><td>Equipment</td><td>{html.escape(line.equipmentId or line.freeText or '')}</td>"
            f"<td>{line.qty}</td><td>{_money(line.unitPrice)}</td><td>{_money(line.lineTotal)}</td></tr>"
        )
        for line in estimate.equipmentLines
    )

    adjustment_rows = "".join(
        (
            f"<tr><td>Adjustment</td><td>{html.escape(adj.code)}</td><td>1</td>"
            f"<td>-</td><td>{_money(adj.amount)}</td></tr>"
        )
        for adj in estimate.adjustments
    )

    totals = estimate.totals
    labor_total = totals.laborTotal if totals else 0.0
    equipment_total = totals.equipmentTotal if totals else 0.0
    adjustments_total = totals.adjustmentsTotal if totals else 0.0
    grand_total = totals.grandTotal if totals else 0.0

    notes = html.escape(estimate.specialNotes or "")

    return f"""
<!doctype html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <style>
      body {{ font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }}
      h1 {{ margin-bottom: 8px; }}
      .meta {{ margin-bottom: 18px; color: #4b5563; font-size: 14px; }}
      table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
      th, td {{ border: 1px solid #d1d5db; padding: 8px; font-size: 13px; }}
      th {{ background: #f3f4f6; text-align: left; }}
      .totals {{ margin-top: 16px; width: 320px; margin-left: auto; }}
      .totals div {{ display: flex; justify-content: space-between; margin: 4px 0; }}
      .grand {{ font-weight: 700; border-top: 1px solid #9ca3af; padding-top: 6px; }}
      .notes {{ margin-top: 20px; white-space: pre-wrap; }}
    </style>
  </head>
  <body>
    <h1>HVAC Estimate</h1>
    <div class=\"meta\">Estimate ID: {html.escape(estimate.id)}<br/>Status: {html.escape(estimate.status)}</div>

    <table>
      <thead>
        <tr><th>Type</th><th>Description</th><th>Qty/Hrs</th><th>Unit</th><th>Total</th></tr>
      </thead>
      <tbody>
        {labor_row}
        {equipment_rows}
        {adjustment_rows}
      </tbody>
    </table>

    <div class=\"totals\">
      <div><span>Labor</span><span>{_money(labor_total)}</span></div>
      <div><span>Equipment</span><span>{_money(equipment_total)}</span></div>
      <div><span>Adjustments</span><span>{_money(adjustments_total)}</span></div>
      <div class=\"grand\"><span>Grand Total</span><span>{_money(grand_total)}</span></div>
    </div>

    <div class=\"notes\"><strong>Special Notes:</strong><br/>{notes}</div>
  </body>
</html>
"""


def _estimate_to_lines(estimate: EstimateRead) -> list[str]:
    lines = [
        "HVAC Estimate",
        f"Estimate ID: {estimate.id}",
        f"Status: {estimate.status}",
        "",
        "Line Items:",
    ]

    if estimate.labor:
        lines.append(
            f"Labor: {estimate.labor.jobType or '-'} / {estimate.labor.level or '-'} | "
            f"Hrs: {estimate.labor.hoursChosen or 0} | Unit: {_money(estimate.labor.hourlyRate)} | "
            f"Total: {_money(estimate.labor.laborTotal)}"
        )

    for line in estimate.equipmentLines:
        description = line.equipmentId or line.freeText or "Equipment"
        lines.append(
            f"Equipment: {description} | Qty: {line.qty} | Unit: {_money(line.unitPrice)} | "
            f"Total: {_money(line.lineTotal)}"
        )

    for adj in estimate.adjustments:
        lines.append(f"Adjustment: {adj.code} | Amount: {_money(adj.amount)}")

    totals = estimate.totals
    labor_total = totals.laborTotal if totals else 0.0
    equipment_total = totals.equipmentTotal if totals else 0.0
    adjustments_total = totals.adjustmentsTotal if totals else 0.0
    grand_total = totals.grandTotal if totals else 0.0

    lines.extend(
        [
            "",
            f"Labor Total: {_money(labor_total)}",
            f"Equipment Total: {_money(equipment_total)}",
            f"Adjustments Total: {_money(adjustments_total)}",
            f"Grand Total: {_money(grand_total)}",
            "",
            "Special Notes:",
        ]
    )

    notes = (estimate.specialNotes or "").strip()
    if notes:
        wrapped_notes = textwrap.wrap(notes, width=90, break_long_words=False, break_on_hyphens=False)
        lines.extend(wrapped_notes or [notes])
    else:
        lines.append("-")

    return lines


def _escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _wrap_pdf_lines(lines: list[str], width: int = 90) -> list[str]:
    wrapped: list[str] = []
    for line in lines:
        if not line:
            wrapped.append("")
            continue

        chunks = textwrap.wrap(line, width=width, break_long_words=False, break_on_hyphens=False)
        wrapped.extend(chunks or [line])
    return wrapped


def _build_simple_pdf(lines: list[str]) -> bytes:
    page_width = 612
    page_height = 792
    left_margin = 72
    top_margin = 72
    font_size = 11
    leading = 14
    lines_per_page = 46

    wrapped_lines = _wrap_pdf_lines(lines)
    pages = [wrapped_lines[i : i + lines_per_page] for i in range(0, len(wrapped_lines), lines_per_page)]
    if not pages:
        pages = [[""]]

    content_objects: list[bytes] = []
    page_objects: list[bytes] = []
    for page_index, page_lines in enumerate(pages):
        content_lines = ["BT", f"/F1 {font_size} Tf", f"{leading} TL", f"{left_margin} {page_height - top_margin} Td"]
        first_line = True
        for line in page_lines:
            escaped = _escape_pdf_text(line)
            if first_line:
                content_lines.append(f"({escaped}) Tj")
                first_line = False
            elif escaped:
                content_lines.append("T*")
                content_lines.append(f"({escaped}) Tj")
            else:
                content_lines.append("T*")
        content_lines.append("ET")
        content_stream = "\n".join(content_lines).encode("utf-8")

        content_objects.append(
            b"<< /Length "
            + str(len(content_stream)).encode("ascii")
            + b" >>\nstream\n"
            + content_stream
            + b"\nendstream"
        )
        content_object_number = 4 + page_index * 2
        page_objects.append(
            (
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_width} {page_height}] "
                f"/Resources << /Font << /F1 3 0 R >> >> /Contents {content_object_number} 0 R >>"
            ).encode("ascii")
        )

    kids = " ".join(f"{5 + index * 2} 0 R" for index in range(len(pages)))
    objects: list[bytes] = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode("ascii"),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    for content_object, page_object in zip(content_objects, page_objects, strict=True):
        objects.append(content_object)
        objects.append(page_object)

    output = BytesIO()
    output.write(b"%PDF-1.4\n")

    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(output.tell())
        output.write(f"{index} 0 obj\n".encode("ascii"))
        output.write(obj)
        output.write(b"\nendobj\n")

    xref_start = output.tell()
    output.write(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.write(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.write(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.write(
        (
            "trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_start}\n%%EOF\n"
        ).encode("ascii")
    )

    return output.getvalue()


def render_estimate_pdf(estimate: EstimateRead) -> bytes:
    html_content = _estimate_to_html(estimate)
    if HTML is not None:
        try:
            return HTML(string=html_content).write_pdf()
        except Exception:
            pass

    return _build_simple_pdf(_estimate_to_lines(estimate))
    '''

import html
import textwrap
from io import BytesIO
from __future__ import annotations

import html
import textwrap
from io import BytesIO

from app.schemas.estimate import EstimateRead

try:
  from weasyprint import HTML
except Exception:  # pragma: no cover
  HTML = None

"""
This module contains the logic for rendering an EstimateRead as a PDF.
It uses WeasyPrint when available and falls back to a small pure-Python PDF renderer
when the native libraries required by WeasyPrint are not installed.
"""


def _money(value: float | None) -> str:
  if value is None:
    return "$0.00"
  return f"${value:,.2f}"


def _estimate_to_html(estimate: EstimateRead) -> str:
  labor_row = ""
  if estimate.labor:
    labor_row = (
      f"<tr><td>Labor</td><td>{html.escape(estimate.labor.jobType or '')}"
      f" / {html.escape(estimate.labor.level or '')}</td>"
      f"<td>{estimate.labor.hoursChosen or 0}</td>"
      f"<td>{_money(estimate.labor.hourlyRate)}</td>"
      f"<td>{_money(estimate.labor.laborTotal)}</td></tr>"
    )

  equipment_rows = "".join(
    (
      f"<tr><td>Equipment</td><td>{html.escape(line.equipmentId or line.freeText or '')}</td>"
      f"<td>{line.qty}</td><td>{_money(line.unitPrice)}</td><td>{_money(line.lineTotal)}</td></tr>"
    )
    for line in estimate.equipmentLines
  )

  adjustment_rows = "".join(
    (
      f"<tr><td>Adjustment</td><td>{html.escape(adj.code)}</td><td>1</td>"
      f"<td>-</td><td>{_money(adj.amount)}</td></tr>"
    )
    for adj in estimate.adjustments
  )

  totals = estimate.totals
  labor_total = totals.laborTotal if totals else 0.0
  equipment_total = totals.equipmentTotal if totals else 0.0
  adjustments_total = totals.adjustmentsTotal if totals else 0.0
  grand_total = totals.grandTotal if totals else 0.0

  notes = html.escape(estimate.specialNotes or "")

  return f"""
<!doctype html>
<html>
  <head>
  <meta charset=\"utf-8\" />
  <style>
    body {{ font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }}
    h1 {{ margin-bottom: 8px; }}
    .meta {{ margin-bottom: 18px; color: #4b5563; font-size: 14px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
    th, td {{ border: 1px solid #d1d5db; padding: 8px; font-size: 13px; }}
    th {{ background: #f3f4f6; text-align: left; }}
    .totals {{ margin-top: 16px; width: 320px; margin-left: auto; }}
    .totals div {{ display: flex; justify-content: space-between; margin: 4px 0; }}
    .grand {{ font-weight: 700; border-top: 1px solid #9ca3af; padding-top: 6px; }}
    .notes {{ margin-top: 20px; white-space: pre-wrap; }}
  </style>
  </head>
  <body>
  <h1>HVAC Estimate</h1>
  <div class=\"meta\">Estimate ID: {html.escape(estimate.id)}<br/>Status: {html.escape(estimate.status)}</div>

  <table>
    <thead>
    <tr><th>Type</th><th>Description</th><th>Qty/Hrs</th><th>Unit</th><th>Total</th></tr>
    </thead>
    <tbody>
    {labor_row}
    {equipment_rows}
    {adjustment_rows}
    </tbody>
  </table>

  <div class=\"totals\">
    <div><span>Labor</span><span>{_money(labor_total)}</span></div>
    <div><span>Equipment</span><span>{_money(equipment_total)}</span></div>
    <div><span>Adjustments</span><span>{_money(adjustments_total)}</span></div>
    <div class=\"grand\"><span>Grand Total</span><span>{_money(grand_total)}</span></div>
  </div>

  <div class=\"notes\"><strong>Special Notes:</strong><br/>{notes}</div>
  </body>
</html>
"""


def _estimate_to_lines(estimate: EstimateRead) -> list[str]:
  lines = [
    "HVAC Estimate",
    f"Estimate ID: {estimate.id}",
    f"Status: {estimate.status}",
    "",
    "Line Items:",
  ]

  if estimate.labor:
    lines.append(
      f"Labor: {estimate.labor.jobType or '-'} / {estimate.labor.level or '-'} | "
      f"Hrs: {estimate.labor.hoursChosen or 0} | Unit: {_money(estimate.labor.hourlyRate)} | "
      f"Total: {_money(estimate.labor.laborTotal)}"
    )

  for line in estimate.equipmentLines:
    description = line.equipmentId or line.freeText or "Equipment"
    lines.append(
      f"Equipment: {description} | Qty: {line.qty} | Unit: {_money(line.unitPrice)} | "
      f"Total: {_money(line.lineTotal)}"
    )

  for adj in estimate.adjustments:
    lines.append(f"Adjustment: {adj.code} | Amount: {_money(adj.amount)}")

  totals = estimate.totals
  labor_total = totals.laborTotal if totals else 0.0
  equipment_total = totals.equipmentTotal if totals else 0.0
  adjustments_total = totals.adjustmentsTotal if totals else 0.0
  grand_total = totals.grandTotal if totals else 0.0

  lines.extend(
    [
      "",
      f"Labor Total: {_money(labor_total)}",
      f"Equipment Total: {_money(equipment_total)}",
      f"Adjustments Total: {_money(adjustments_total)}",
      f"Grand Total: {_money(grand_total)}",
      "",
      "Special Notes:",
    ]
  )

  notes = (estimate.specialNotes or "").strip()
  if notes:
    wrapped_notes = textwrap.wrap(notes, width=90, break_long_words=False, break_on_hyphens=False)
    lines.extend(wrapped_notes or [notes])
  else:
    lines.append("-")

  return lines


def _escape_pdf_text(text: str) -> str:
  return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _wrap_pdf_lines(lines: list[str], width: int = 90) -> list[str]:
  wrapped: list[str] = []
  for line in lines:
    if not line:
      wrapped.append("")
      continue

    chunks = textwrap.wrap(line, width=width, break_long_words=False, break_on_hyphens=False)
    wrapped.extend(chunks or [line])
  return wrapped


def _build_simple_pdf(lines: list[str]) -> bytes:
  page_width = 612
  page_height = 792
  left_margin = 72
  top_margin = 72
  font_size = 11
  leading = 14
  lines_per_page = 46

  wrapped_lines = _wrap_pdf_lines(lines)
  pages = [wrapped_lines[i : i + lines_per_page] for i in range(0, len(wrapped_lines), lines_per_page)]
  if not pages:
    pages = [[""]]

  page_objects = []
  content_objects = []
  for page_index, page_lines in enumerate(pages):
    content_lines = ["BT", f"/F1 {font_size} Tf", f"{leading} TL", f"{left_margin} {page_height - top_margin} Td"]
    first_line = True
    for line in page_lines:
      escaped = _escape_pdf_text(line)
      if first_line:
        content_lines.append(f"({escaped}) Tj")
        first_line = False
      elif escaped:
        content_lines.append("T*")
        content_lines.append(f"({escaped}) Tj")
      else:
        content_lines.append("T*")
    content_lines.append("ET")
    content_stream = "\n".join(content_lines).encode("utf-8")

    content_objects.append(
      b"<< /Length "
      + str(len(content_stream)).encode("ascii")
      + b" >>\nstream\n"
      + content_stream
      + b"\nendstream"
    )
    content_object_number = 4 + page_index * 2
    page_objects.append(
      (
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_width} {page_height}] "
        f"/Resources << /Font << /F1 3 0 R >> >> /Contents {content_object_number} 0 R >>"
      ).encode("ascii")
    )

  objects: list[bytes] = [
    b"<< /Type /Catalog /Pages 2 0 R >>",
    f"<< /Type /Pages /Kids [{' '.join(f'{5 + index * 2} 0 R' for index in range(len(pages)))}] /Count {len(pages)} >>".encode(
      "ascii"
    ),
    b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ]

  for content_object, page_object in zip(content_objects, page_objects, strict=True):
    objects.append(content_object)
    objects.append(page_object)

  output = BytesIO()
  output.write(b"%PDF-1.4\n")

  offsets = [0]
  for index, obj in enumerate(objects, start=1):
    offsets.append(output.tell())
    output.write(f"{index} 0 obj\n".encode("ascii"))
    output.write(obj)
    output.write(b"\nendobj\n")

  xref_start = output.tell()
  output.write(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
  output.write(b"0000000000 65535 f \n")
  for offset in offsets[1:]:
    output.write(f"{offset:010d} 00000 n \n".encode("ascii"))
  output.write(
    (
      "trailer\n"
      f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
      f"startxref\n{xref_start}\n%%EOF\n"
    ).encode("ascii")
  )

  return output.getvalue()


def render_estimate_pdf(estimate: EstimateRead) -> bytes:
  html_content = _estimate_to_html(estimate)
  if HTML is not None:
    try:
      return HTML(string=html_content).write_pdf()
    except Exception:
      pass

  return _build_simple_pdf(_estimate_to_lines(estimate))

'''
