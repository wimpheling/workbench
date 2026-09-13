"""Revision-bound supplier quotation packages, never implicit release to order.

Drawings use the part's explicit local cutting coordinates. Assembly coordinates
are intentionally not substituted for supplier cutting dimensions.
"""

from __future__ import annotations

import copy
import csv
import io
import json
import math
import tempfile
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

import cadquery as cq
import ezdxf
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def physical_parts(model: dict) -> list[dict]:
    return [
        p
        for p in model["parts"]
        if p["category"] not in {"machine-envelope", "hose-envelope", "reference"}
        and not p.get("reference_only", False)
    ]


def release_label(report: dict) -> str:
    return (
        "ORDER READY"
        if report.get("order_ready")
        else "REQUEST FOR QUOTATION - NOT RELEASED FOR ORDER"
    )


def material_spec(part: dict) -> str:
    return (
        "Tempered glass - supplier specification pending"
        if part["category"] == "glass"
        else part["material"]
    )


def drawing_groups(model: dict) -> list[dict]:
    """Group identical supplier cuts while retaining every assembly part identity."""
    groups = {}
    for part in physical_parts(model):
        if part["category"] not in {"extrusion", "panel", "glass"}:
            continue
        dimensions = (
            drawing_size(part)
            if part["category"] in {"panel", "glass"}
            else (part.get("cut_length_mm"),)
        )
        key = json.dumps(
            [
                part["category"],
                part["material"],
                part.get("supplier"),
                part.get("product_code"),
                dimensions,
                part.get("holes"),
                part.get("edge_finish"),
                part.get("end_treatment"),
                part.get("machining"),
                part.get("cutouts"),
                part.get("geometry_fidelity"),
            ],
            sort_keys=True,
        )
        if key not in groups:
            groups[key] = copy.deepcopy(part)
            groups[key]["quantity"] = 0
            groups[key]["source_part_ids"] = []
        groups[key]["quantity"] += part.get("quantity", 1)
        groups[key]["source_part_ids"].append(part["id"])
    return list(groups.values())


def drawing_size(part: dict) -> tuple[float, float, float]:
    """Require explicit local cutting dimensions for sheet materials."""
    dims = part.get("cut_size_mm")
    if not isinstance(dims, (list, tuple)) or len(dims) != 3:
        raise ValueError(
            f"{part['id']}: missing explicit cut_size_mm; supplier outline cannot be inferred"
        )
    if any(not math.isfinite(float(v)) or float(v) <= 0 for v in dims):
        raise ValueError(f"{part['id']}: invalid supplier cutting dimensions")
    return tuple(float(v) for v in dims)


def _safe_cell(value) -> str:
    text = str(value)
    # External supplier references may be opened in spreadsheet applications.
    return "'" + text if text[:1] in {"=", "+", "-", "@"} else text


def supplier_csv(model: dict, report: dict, categories: set[str] | None = None) -> bytes:
    out = io.StringIO(newline="")
    writer = csv.writer(out)
    writer.writerow(
        [
            "revision",
            "release_status",
            "part_id",
            "name",
            "supplier",
            "product_code",
            "material",
            "quantity",
            "cut_length_mm",
            "width_mm",
            "height_mm",
            "thickness_mm",
            "cut_tolerance_mm",
            "edge_or_end_finish",
            "machining",
            "geometry_fidelity",
            "nominal_envelope_x_mm",
            "nominal_envelope_y_mm",
            "nominal_envelope_z_mm",
            "seal_specification",
            "cutouts",
        ]
    )
    for part in physical_parts(model):
        if categories is not None and part["category"] not in categories:
            continue
        dims = drawing_size(part) if part["category"] in {"panel", "glass"} else ("", "", "")
        row = [
            model["revision"],
            release_label(report),
            part["id"],
            part["name"],
            part.get("supplier", "To be selected"),
            part.get("product_code") or "Selection pending",
            material_spec(part),
            part.get("quantity", 1),
            part.get("cut_length_mm", ""),
            *dims,
            model["parameters"].get("cut_tolerance_mm", "Supplier confirmation required"),
            part.get("edge_finish", part.get("end_treatment", "Supplier confirmation required")),
            json.dumps(part.get("machining", part.get("holes", [])), ensure_ascii=False),
            part.get("geometry_fidelity", "unknown"),
            *part.get("size", ["", "", ""]),
            json.dumps(part.get("seal_spec", {}), ensure_ascii=False),
            json.dumps(part.get("cutouts", []), ensure_ascii=False),
        ]
        writer.writerow([_safe_cell(v) for v in row])
    return out.getvalue().encode("utf-8-sig")


class PartDrawing(Flowable):
    """Dimensioned flat local cutting outline, fit to A4; never marked full scale."""

    def __init__(self, part: dict):
        Flowable.__init__(self)
        self.part = part
        self.width, self.height = 475, 265

    def draw(self):
        c = self.canv
        p = self.part
        if p["category"] in {"panel", "glass"}:
            w, h, thickness = drawing_size(p)
        else:
            w = float(p.get("cut_length_mm", max(p["size"])))
            h = sorted(p["size"])[1]
            thickness = min(p["size"])
        scale = min(380 / w, 180 / h)
        x, y = 48, 45
        c.setStrokeColor(colors.HexColor("#253847"))
        c.rect(x, y, w * scale, h * scale)
        c.setFont("Helvetica", 9)
        c.line(x, y - 14, x + w * scale, y - 14)
        for px in (x, x + w * scale):
            c.line(px, y - 20, px, y - 5)
        c.drawCentredString(x + w * scale / 2, y - 27, f"{w:g} mm")
        c.line(x - 14, y, x - 14, y + h * scale)
        c.saveState()
        c.translate(x - 22, y + h * scale / 2)
        c.rotate(90)
        c.drawCentredString(0, 0, f"{h:g} mm")
        c.restoreState()
        for hole in p.get("holes", []):
            hx, hy, d = hole["x_mm"], hole["y_mm"], hole["diameter_mm"]
            c.circle(x + hx * scale, y + hy * scale, d * scale / 2)
            c.drawString(
                x, y + h * scale + 13, f"Hole: diameter {d:g} mm; centre ({hx:g}, {hy:g}) mm"
            )
        for cutout in p.get("cutouts", []):
            if cutout.get("kind") != "rectangle":
                raise ValueError(f"Unsupported supplier cutout: {cutout.get('kind')}")
            if "center_local_mm" in cutout:
                axes = sorted(range(3), key=lambda i: p["size"][i], reverse=True)[:2]
                cut_axes = [i for i in range(3) if i != cutout["normal_axis"]]
                if axes != cut_axes:
                    c.drawString(
                        x,
                        y + h * scale + 13,
                        "Relief on another face: see local 3D schedule and STEP.",
                    )
                    continue
                cw, ch = cutout["width_mm"], cutout["height_mm"]
                cx = cutout["center_local_mm"][axes[0]] + w / 2 - cw / 2
                cy = cutout["center_local_mm"][axes[1]] + h / 2 - ch / 2
            else:
                cx, cy, cw, ch = (cutout[key] for key in ("x_mm", "y_mm", "width_mm", "height_mm"))
            c.rect(x + cx * scale, y + cy * scale, cw * scale, ch * scale)
            c.drawString(
                x,
                y + h * scale + 13,
                f"Cutout {cw:g} x {ch:g} mm; lower-left ({cx:g}, {cy:g}) mm",
            )
        c.drawString(
            x,
            3,
            f"Local origin: lower-left. Thickness / section depth: {thickness:g} mm. NOT TO SCALE.",
        )


class AssemblyDrawing(Flowable):
    """Nominal assembly elevations; exact supplier section detail remains in STEP."""

    def __init__(self, model: dict, view: str):
        Flowable.__init__(self)
        self.model, self.view = model, view
        self.width, self.height = 480, 370

    def draw(self):
        c, model, view = self.canv, self.model, self.view
        p = model["parameters"]
        w, d, h = p["width_mm"], p["depth_mm"], p["height_mm"]
        axes = (0, 1) if view == "top" else (1, 2) if view == "left" else (0, 2)
        clear = (w, d) if view == "top" else (d, h) if view == "left" else (w, h)
        scale = min(400 / (clear[0] + 120), 260 / (clear[1] + 120))
        x, y = 55, 45
        c.setFont("Helvetica", 8)
        for part in sorted(physical_parts(model), key=lambda item: item["category"] == "extrusion"):
            if part["category"] == "hardware":
                continue
            id = part["id"]
            visible = (
                part["position"][2] >= h
                if view == "top"
                else "front" in id
                if view == "front"
                else "left" in id
                if view == "left"
                else "back" in id
            )
            if not visible:
                continue
            a = math.radians(part.get("rotation_deg", 0))
            sx, sy, sz = part["size"]
            corners = []
            for xx in (-sx / 2, sx / 2):
                for yy in (-sy / 2, sy / 2):
                    for zz in (-sz / 2, sz / 2):
                        world = (
                            part["position"][0] + xx * math.cos(a) - yy * math.sin(a),
                            part["position"][1] + xx * math.sin(a) + yy * math.cos(a),
                            part["position"][2] + zz,
                        )
                        corners.append((world[axes[0]], world[axes[1]]))
            lo = [min(point[i] for point in corners) for i in (0, 1)]
            hi = [max(point[i] for point in corners) for i in (0, 1)]
            c.setStrokeColor(colors.HexColor("#435c53"))
            c.setFillColor(
                colors.HexColor("#edf3f0")
                if part["category"] == "glass"
                else colors.HexColor("#e9e1cf")
            )
            c.rect(
                x + lo[0] * scale,
                y + lo[1] * scale,
                (hi[0] - lo[0]) * scale,
                (hi[1] - lo[1]) * scale,
                fill=int(part["category"] != "extrusion"),
                stroke=1,
            )
        c.setStrokeColor(colors.black)
        c.line(x, y - 18, x + clear[0] * scale, y - 18)
        c.drawCentredString(x + clear[0] * scale / 2, y - 30, f"Clear {clear[0]:g} mm")
        c.saveState()
        c.translate(x - 25, y + clear[1] * scale / 2)
        c.rotate(90)
        c.drawCentredString(0, 0, f"Clear {clear[1]:g} mm")
        c.restoreState()
        c.drawString(
            15,
            5,
            "Nominal part envelopes, closed assembly; not to scale. Use part sheets for ordering.",
        )


def supplier_pdf(model: dict, report: dict) -> bytes:
    stream = io.BytesIO()
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(
        stream,
        pagesize=A4,
        title=f"Enclosure supplier specification {model['revision']}",
        author="Workbench V3",
        leftMargin=40,
        rightMargin=40,
    )

    def para(text, style="BodyText"):
        return Paragraph(escape(str(text)), styles[style])

    story = [
        para("Enclosure / Especificação para fornecedores", "Title"),
        para(release_label(report), "Heading2"),
        para(
            f"Revision: {model['revision']} | Units: millimetres | Supplier: Reiman Portugal / panel supplier"
        ),
        Spacer(1, 12),
        para(
            "Scope: supplier-cut aluminium profiles, panels and purchased hardware. Dimensions are finished sizes, not saw toolpaths. No instruction to fabricate is implied while unresolved requirements remain."
        ),
        para(
            "Tempered glass: supplier must confirm thickness, edge finish, retention and all hole/cutout requirements before tempering. No field drilling, cutting or grinding is specified. Glass selection is not an impact-containment certification."
        ),
        para("Open requirements", "Heading2"),
    ]
    unresolved = [c for c in report["checks"] if c["status"] != "pass"]
    for check in unresolved:
        story.append(para(f"{check['status'].upper()} {check['id']}: {check['message']}"))
    if not unresolved:
        story.append(para("No unresolved checks within the report's declared verification scope."))
    story.extend([Spacer(1, 10), para("Assembly and receiving checks", "Heading2")])
    for line in assembly_notes(model).splitlines():
        if line.strip():
            story.append(para(line))
    if model.get("containment"):
        story.extend([PageBreak(), para("Seals and airflow / Juntas e ventilação", "Heading1")])
        for line in containment_notes(model).splitlines():
            if line.strip():
                story.append(para(line))
    for view in ("front", "left", "back", "top"):
        story.extend(
            [
                PageBreak(),
                para(f"Assembly - {view} view", "Heading1"),
                para(f"Revision {model['revision']} | {release_label(report)}"),
                AssemblyDrawing(model, view),
                para(
                    "All dimensions identify the clear structural cavity. Hardware projections and door operating space are additional; inspect the STEP model and motion evidence. Supplier mounting schedules remain required."
                ),
            ]
        )
    hardware = [part for part in physical_parts(model) if part["category"] == "hardware"]
    if hardware:
        story.extend(
            [
                PageBreak(),
                para("Hardware schedule", "Heading1"),
                para(
                    "Purchased components; pending references and mounting details require supplier confirmation."
                ),
            ]
        )
        rows = [
            [para("Part"), para("Product reference"), para("Nominal envelope, mm"), para("Qty")]
        ]
        rows.extend(
            [
                [
                    para(part["id"]),
                    para(part.get("product_code") or "Selection pending"),
                    para(" × ".join(f"{v:g}" for v in part["size"])),
                    para(part.get("quantity", 1)),
                ]
                for part in hardware
            ]
        )
        table = Table(rows, colWidths=[230, 130, 115, 25], repeatRows=1)
        table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e7eeeb")),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ]
            )
        )
        story.append(table)
    for part in drawing_groups(model):
        story.extend(
            [
                PageBreak(),
                para(part["name"].capitalize(), "Heading1"),
                para(
                    f"{part['id']} | Quantity {part.get('quantity', 1)} | Revision {model['revision']}"
                ),
                para(release_label(report)),
                para(
                    f"Supplier: {part.get('supplier', 'To be selected')} | Reference: {part.get('product_code') or 'Pending'} | Material: {material_spec(part)}"
                ),
                para(f"Geometry evidence: {part.get('geometry_fidelity', 'unknown')}"),
                Spacer(1, 12),
            ]
        )
        story.append(para("Assembly part IDs: " + ", ".join(part["source_part_ids"])))
        if part["category"] in {"extrusion", "panel", "glass"}:
            story.append(PartDrawing(part))
        else:
            story.append(
                para(
                    "Purchased hardware: order by confirmed product reference. Illustrated/modelled envelope is not a machining drawing."
                )
            )
        story.append(
            para(
                f"Requested cutting tolerance: ±{model['parameters'].get('cut_tolerance_mm', 'pending')} mm, subject to supplier acceptance."
            )
        )
        story.append(
            para(
                f"Finish: {part.get('edge_finish', part.get('end_treatment', 'Supplier confirmation required'))}"
            )
        )
        story.append(
            para(
                f"Machining / mounting: {json.dumps(part.get('machining', []), ensure_ascii=False)}"
            )
        )
        if part.get("holes"):
            story.append(
                para(f"Hole schedule (local origin lower-left): {json.dumps(part['holes'])}")
            )
        if part.get("cutouts"):
            origin = (
                "part-centred XYZ; normal_axis 0=X, 1=Y, 2=Z"
                if any("center_local_mm" in cutout for cutout in part["cutouts"])
                else "local origin lower-left"
            )
            story.append(para(f"Cutout schedule ({origin}): {json.dumps(part['cutouts'])}"))
        if part["category"] == "glass" and not part.get("holes") and not part.get("cutouts"):
            story.append(
                para(
                    "No holes or cutouts are currently declared. Supplier must confirm retention, edge finish and any required processing before tempering; do not treat absence of holes as an approved mounting design."
                )
            )

    def footer(canvas, document):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.drawString(
            40, 20, f"{model['revision']} | {release_label(report)} | Page {document.page}"
        )
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return stream.getvalue()


def panel_dxf(model: dict, report: dict) -> bytes:
    doc = ezdxf.new("R2010")
    doc.units = ezdxf.units.MM
    doc.header["$INSUNITS"] = 4
    msp = doc.modelspace()
    x = 0.0
    for name in ("CUT", "HOLES", "ANNOTATIONS"):
        doc.layers.new(name=name)
    msp.add_text(
        f"REVISION {model['revision']} - {release_label(report)} - mm",
        dxfattribs={"height": 12, "layer": "ANNOTATIONS"},
    ).set_placement((0, -60))
    for part in physical_parts(model):
        if part["category"] not in {"panel", "glass"}:
            continue
        w, h, t = drawing_size(part)
        msp.add_lwpolyline(
            [(x, 0), (x + w, 0), (x + w, h), (x, h)], close=True, dxfattribs={"layer": "CUT"}
        )
        for hole in part.get("holes", []):
            msp.add_circle(
                (x + hole["x_mm"], hole["y_mm"]),
                hole["diameter_mm"] / 2,
                dxfattribs={"layer": "HOLES"},
            )
        for cutout in part.get("cutouts", []):
            if cutout.get("kind") != "rectangle":
                raise ValueError(f"Unsupported supplier cutout: {cutout.get('kind')}")
            cx, cy, cw, ch = (cutout[key] for key in ("x_mm", "y_mm", "width_mm", "height_mm"))
            msp.add_lwpolyline(
                [(x + cx, cy), (x + cx + cw, cy), (x + cx + cw, cy + ch), (x + cx, cy + ch)],
                close=True,
                dxfattribs={"layer": "HOLES"},
            )
        msp.add_text(
            f"{part['id']} qty={part.get('quantity', 1)} {w:g} x {h:g} x {t:g} mm",
            dxfattribs={"height": 10, "layer": "ANNOTATIONS"},
        ).set_placement((x, -25))
        x += w + 80
    stream = io.StringIO()
    doc.write(stream)
    return stream.getvalue().encode("utf-8")


def assembly_step(model: dict, shapes: dict) -> bytes:
    assembly = cq.Assembly(name=f"enclosure_{model['revision']}")
    for part in physical_parts(model):
        shape = shapes.get(part["id"])
        if shape is None:
            raise ValueError(f"Missing physical shape for STEP export: {part['id']}")
        assembly.add(shape, name=part["id"].replace(":", "_"))
    with tempfile.TemporaryDirectory(prefix="workbench-v3-step-") as tmp:
        path = Path(tmp) / "enclosure.step"
        assembly.export(str(path), exportType="STEP")
        return path.read_bytes()


def assembly_notes(model: dict) -> str:
    return "\n".join(
        [
            "ASSEMBLY GUIDANCE - pending supplier installation instructions",
            "1. Obtain confirmation of every unresolved hardware, panel-retention and machining interface before placing final orders.",
            "2. On delivery, identify every piece against its part ID; measure cut lengths and panel thickness against the accepted tolerances.",
            "3. Assemble the base and upright frame loosely on the final support. Compare diagonals and adjust squareness before tightening to supplier instructions.",
            "4. Assemble door frames and retain panels using the confirmed retention system. Support glass clear of metal with the specified isolators.",
            "5. Install hinges, guides, stops and latches using their confirmed mounting schedules. Support door weight during adjustment.",
            "6. Verify closed perimeter and meeting gaps, then traverse each front and bifold door slowly. Confirm guide retention and usable access.",
            "7. Fit roof panels and hose support. Jog the actual machine through its permitted travel while observing cable and hose clearance.",
            "8. Record frame squareness, measured gaps and completed installation checks against this design revision.",
            "9. For the containment revision, follow the seal/airflow specification and front-door sequence. Confirm all rubber corner joints, membrane folds, hose collar and base-to-table seal; verify inward airflow with extraction operating and repeat at representative filter loading.",
            "This guidance does not specify unconfirmed drill patterns, tightening torques, glass processing or supplier-specific installation sequences.",
        ]
    )


def containment_notes(model: dict) -> str:
    if not model.get("containment"):
        return "No containment specification is declared in this model."
    sequence = model.get("door_sequence", {})
    lines = [
        f"SEAL AND AIRFLOW DESIGN PROPOSAL - revision {model['revision']} - millimetres",
        "Nominal barriers are not a dust-performance certification. Use verification.json for measured coverage and unresolved evidence.",
        "Close front leaves: "
        + " then ".join(sequence.get("closing", []))
        + ". Open: "
        + " then ".join(sequence.get("opening", []))
        + ".",
        "Supplier must select rubber grade/profile, free section, installed compression, corner treatment, clamping/adhesive and fixing pitch. Continuous glass-compatible packing and setting support must be confirmed before tempering. Dimensions in hardware.csv are candidate installed envelopes, not approved catalogue sizes.",
        "Bifold meeting covers need a supplier-confirmed flexible fold, clamp layout and endurance allowance; their displayed rigid pose is not a simulation of rubber deformation.",
        "Bifolds use revision C A1 mini PETG guide modules under 3060 headers, bought CFG hinges and GN753.1 rollers. The carrier remains an envelope, not a printable release. Confirm M4 fixings, bushes, axle stack, independent metal stops/catches, sealing and physical load/wear tests. Printed lips are not independent metal retention.",
        "Seal the base against a flat continuous supporting table. The tabletop, its load capacity and cable/service penetrations need confirmation.",
        "Retain the roof collar and clamp the independently supported hose. Confirm bend radius and clearance through full machine travel.",
        "Use passive makeup air and extraction at the dust shoe, with vacuum exhaust outside the enclosure. Keep the baffled inlet clear and accessible for cleaning. No inlet fan or extractor performance is assumed.",
    ]
    for entry in model["containment"]:
        if entry.get("kind") == "baffled-air-inlet":
            lines.append(
                f"Inlet {entry['id']}: opening {entry.get('opening_size_mm')} mm; nominal opening area {entry.get('opening_area_mm2')} mm²; declared throat area {entry.get('throat_area_mm2')} mm². These geometric areas do not establish available flow or pressure loss."
            )
    lines.append(
        "Commissioning: measure extraction flow with the actual shoe, hose and filter; check inward leakage and particle escape at closed seams, confirm machine cooling, and inspect seals after repeated door cycles. No required airflow is claimed without the selected extractor and installation evidence."
    )
    return "\n".join(lines)


def export_file(kind: str, model: dict, report: dict, shapes: dict) -> tuple[bytes, str, str]:
    revision = model["revision"][:16]
    stem = f"enclosure-{revision}"
    if kind == "json":
        return (
            json.dumps({"model": model, "report": report}, indent=2, allow_nan=False).encode(),
            "application/json",
            stem + ".json",
        )
    if kind == "csv":
        return supplier_csv(model, report), "text/csv; charset=utf-8", stem + ".csv"
    if kind == "pdf":
        return supplier_pdf(model, report), "application/pdf", stem + ".pdf"
    if kind == "dxf":
        return panel_dxf(model, report), "application/dxf", stem + ".dxf"
    if kind == "step":
        return assembly_step(model, shapes), "application/step", stem + ".step"
    if kind != "pack":
        raise ValueError(f"Unsupported export format: {kind}")
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "README.txt",
            f"{release_label(report)}\nRevision: {model['revision']}\nUnits: mm\n\n"
            "Delivery location: Lisbon, Portugal. Extrusion supplier: Reiman Portugal.\n"
            "STEP is a geometric reference; proxies and unresolved interfaces are identified in model.json.\n"
            "DXF: local panel outlines arranged side by side at 1:1 in mm; annotations are on a separate layer.\n"
            "Do not machine supplier hardware from its bounding envelope.\n\n"
            + assembly_notes(model),
        )
        archive.writestr("model.json", json.dumps(model, indent=2, allow_nan=False))
        archive.writestr("verification.json", json.dumps(report, indent=2, allow_nan=False))
        archive.writestr("reiman-extrusions.csv", supplier_csv(model, report, {"extrusion"}))
        archive.writestr("glass-panels.csv", supplier_csv(model, report, {"glass"}))
        wood = {**model, "parts": [p for p in model["parts"] if p["material"] == "wood"]}
        plastic = {
            **model,
            "parts": [p for p in model["parts"] if p["material"] == "polycarbonate"],
        }
        archive.writestr("wood-panels.csv", supplier_csv(wood, report, {"panel"}))
        archive.writestr("polycarbonate-panels.csv", supplier_csv(plastic, report, {"panel"}))
        archive.writestr("hardware.csv", supplier_csv(model, report, {"hardware"}))
        archive.writestr("containment-and-airflow.txt", containment_notes(model))
        archive.writestr("supplier-drawings.pdf", supplier_pdf(model, report))
        archive.writestr("panel-outlines.dxf", panel_dxf(model, report))
        archive.writestr("assembly.step", assembly_step(model, shapes))
    return stream.getvalue(), "application/zip", stem + "-quotation-pack.zip"
