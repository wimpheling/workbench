import csv
import io
import json
import zipfile

import cadquery as cq
import ezdxf
import pytest
from enclosure.exports import drawing_size, export_file
from pypdf import PdfReader


@pytest.fixture
def specification():
    model = {
        "revision": "test-revision",
        "parameters": {"cut_tolerance_mm": 0.5, "width_mm": 500, "depth_mm": 400, "height_mm": 300},
        "parts": [
            {
                "id": "rail",
                "name": "Rail",
                "category": "extrusion",
                "material": "aluminium",
                "supplier": "Reiman Portugal",
                "product_code": "AST03003004",
                "size": [500, 30, 30],
                "position": [250, 0, 0],
                "cut_length_mm": 500,
                "quantity": 2,
                "geometry_fidelity": "nominal-solid",
            },
            {
                "id": "glass",
                "name": "Glass door",
                "category": "glass",
                "material": "tempered-glass",
                "size": [100, 6, 200],
                "position": [0, 0, 0],
                "cut_size_mm": [100, 200, 6],
                "quantity": 1,
                "holes": [{"x_mm": 40, "y_mm": 60, "diameter_mm": 10}],
            },
            {
                "id": "machine",
                "name": "Machine reference",
                "category": "machine-envelope",
                "material": "reference",
                "size": [800, 800, 500],
                "quantity": 1,
            },
        ],
    }
    report = {
        "revision": "test-revision",
        "order_ready": False,
        "status": "incomplete",
        "checks": [{"id": "supplier", "status": "unknown", "message": "Confirm glass retention"}],
    }
    shapes = {
        "rail": cq.Workplane("XY").box(500, 30, 30).val(),
        "glass": cq.Workplane("XY").box(100, 6, 200).val(),
    }
    return model, report, shapes


def test_csv_preserves_cut_dimensions_quantities_and_pending_state(specification):
    model, report, shapes = specification
    data, _, _ = export_file("csv", model, report, shapes)
    rows = list(csv.DictReader(io.StringIO(data.decode("utf-8-sig"))))
    assert len(rows) == 2
    assert rows[0]["cut_length_mm"] == "500"
    assert rows[0]["quantity"] == "2"
    assert rows[1]["width_mm"] == "100.0"
    assert rows[1]["height_mm"] == "200.0"
    assert all("NOT RELEASED" in row["release_status"] for row in rows)
    assert rows[0]["nominal_envelope_x_mm"] == "500"


def test_centred_header_relief_is_converted_to_drawing_origin(specification):
    model, report, shapes = specification
    rail = model["parts"][0]
    rail["size"] = [500, 60, 30]
    rail["cutouts"] = [
        dict(
            kind="rectangle",
            normal_axis=2,
            width_mm=15.5,
            height_mm=15.5,
            center_local_mm=[-242.25, -22.25, 0],
        )
    ]
    data, _, _ = export_file("pdf", model, report, shapes)
    text = " ".join(page.extract_text() for page in PdfReader(io.BytesIO(data)).pages)
    assert "lower-left (0, 0) mm" in text
    assert "part-centred XYZ" in text
    assert "NOT RELEASED" in text


def test_seal_quote_preserves_section_and_compression_request(specification):
    model, report, shapes = specification
    model["parts"].append(
        {
            "id": "seal",
            "name": "Door perimeter seal",
            "category": "hardware",
            "material": "EPDM rubber - selection pending",
            "size": [500, 12, 8],
            "cut_length_mm": 500,
            "seal_spec": {"free_height_mm": 10, "installed_height_mm": 8},
        }
    )
    data, _, _ = export_file("csv", model, report, shapes)
    row = list(csv.DictReader(io.StringIO(data.decode("utf-8-sig"))))[-1]
    assert row["cut_length_mm"] == "500"
    assert row["nominal_envelope_z_mm"] == "8"
    assert json.loads(row["seal_specification"])["free_height_mm"] == 10
    assert row["product_code"] == "Selection pending"


def test_dxf_is_mm_and_retains_hole_size_and_position(specification):
    data, _, _ = export_file("dxf", *specification)
    doc = ezdxf.read(io.StringIO(data.decode()))
    assert doc.units == 4
    outlines = list(doc.modelspace().query("LWPOLYLINE"))
    assert len(outlines) == 1
    assert outlines[0].closed
    assert tuple(outlines[0].get_points()[2][:2]) == (100, 200)
    hole = list(doc.modelspace().query("CIRCLE"))[0]
    assert tuple(hole.dxf.center) == (40, 60, 0)
    assert hole.dxf.radius == 5


def test_rectangular_air_inlet_cutout_matches_supplier_files(specification):
    model, report, shapes = specification
    panel = model["parts"][1]
    panel["cutouts"] = [
        {"kind": "rectangle", "x_mm": 15, "y_mm": 20, "width_mm": 50, "height_mm": 60}
    ]
    data, _, _ = export_file("dxf", model, report, shapes)
    doc = ezdxf.read(io.StringIO(data.decode()))
    cutouts = [e for e in doc.modelspace().query("LWPOLYLINE") if e.dxf.layer == "HOLES"]
    assert len(cutouts) == 1 and cutouts[0].closed
    assert [tuple(p[:2]) for p in cutouts[0].get_points()] == [
        (15, 20),
        (65, 20),
        (65, 80),
        (15, 80),
    ]
    pdf, _, _ = export_file("pdf", model, report, shapes)
    text = "\n".join(page.extract_text() for page in PdfReader(io.BytesIO(pdf)).pages)
    assert "Cutout 50 x 60 mm; lower-left (15, 20) mm" in text
    csv_data, _, _ = export_file("csv", model, report, shapes)
    row = list(csv.DictReader(io.StringIO(csv_data.decode("utf-8-sig"))))[1]
    assert json.loads(row["cutouts"])[0]["width_mm"] == 50


def test_pdf_and_step_are_real_documents(specification, tmp_path):
    pdf, _, _ = export_file("pdf", *specification)
    assert pdf.startswith(b"%PDF-")
    document = PdfReader(io.BytesIO(pdf))
    text = "\n".join(page.extract_text() for page in document.pages)
    assert "NOT RELEASED FOR ORDER" in text
    assert "500 mm" in text
    assert "100 mm" in text
    assert "200 mm" in text
    assert "test-revision" in text
    step, _, _ = export_file("step", *specification)
    path = tmp_path / "assembly.step"
    path.write_bytes(step)
    imported = cq.importers.importStep(str(path))
    assert len(imported.solids().vals()) == 2
    assert sum(s.Volume() for s in imported.solids().vals()) == pytest.approx(
        500 * 30 * 30 + 100 * 6 * 200
    )


def test_pack_separates_supplier_parts_and_includes_evidence(specification):
    data, _, name = export_file("pack", *specification)
    assert name.endswith("quotation-pack.zip")
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        assert set(archive.namelist()) == {
            "README.txt",
            "model.json",
            "verification.json",
            "reiman-extrusions.csv",
            "glass-panels.csv",
            "wood-panels.csv",
            "polycarbonate-panels.csv",
            "hardware.csv",
            "containment-and-airflow.txt",
            "supplier-drawings.pdf",
            "panel-outlines.dxf",
            "assembly.step",
        }
        assert json.loads(archive.read("verification.json"))["order_ready"] is False
        assert b"NOT RELEASED" in archive.read("README.txt")
        assert b"AST03003004" in archive.read("reiman-extrusions.csv")
        assert b"glass" not in archive.read("reiman-extrusions.csv")


def test_supplier_dimensions_are_not_inferred_from_world_boxes():
    with pytest.raises(ValueError, match="explicit cut_size"):
        drawing_size({"id": "p", "size": [6, 200, 100]})


def test_missing_shape_blocks_step(specification):
    model, report, _ = specification
    with pytest.raises(ValueError, match="Missing physical shape"):
        export_file("step", model, report, {})
